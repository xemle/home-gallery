import { filterEntriesByQuery } from '../../query/src/index.js'


import Logger from '@home-gallery/logger';

const log = Logger('server.remote-sources');
const remoteDb = {}; // keyed by sourceName

async function fetchRemoteDatabase(source) {
  const { url, name, key, retries = 2, timeout = 10000 } = source;
  log.info(`Starting fetch for remote source: name='${name}', url='${url}', key=${key ? 'SET' : 'NONE'}, retries=${retries}, timeout=${timeout}ms`);

  const headers = key ? { 'X-Remote-Key': key } : {};
  log.info(`Headers for fetch: ${JSON.stringify(headers)}`);

  let lastErr = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
	const url = source.url.replace(/\/+$/,'') + '/api/database.json';
    log.info(`Attempt ${attempt + 1} to fetch remote database '${name}' from ${url}`);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => {
        log.warn(`Timeout reached for '${name}' (${timeout}ms), aborting fetch`);
        controller.abort();
      }, timeout);

	const res = await fetch(url, { headers });

      clearTimeout(timer);

      log.info(`Received HTTP status ${res.status} from '${name}'`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      log.info(`Parsed JSON from '${name}'`);

      if (!data?.data) log.warn(`Remote database '${name}' has no .data array`);
      else log.info(`Remote database '${name}' contains ${data.data.length} entries`);
		if (source.searchmask && data?.data?.length) {
		  const beforeCount = data.data.length;
		  log.info(`Applying searchmask '${source.searchmask}' to remote '${name}' (${beforeCount} total entries before filter)`);

		  const { entries } = await filterEntriesByQuery(data.data, source.searchmask);
		  const afterCount = entries.length;
		  const discarded = beforeCount - afterCount;

		  data.data = entries;

		  log.info(`Filtered remote '${name}' with searchmask '${source.searchmask}':`);
		  log.info(`  Entries before: ${beforeCount}`);
		  log.info(`  Entries after:  ${afterCount}`);
		  log.info(`  Matched:        ${afterCount}`);
		  log.info(`  Discarded:      ${discarded}`);
		}

		return data;
    } catch (err) {
      lastErr = err;
      log.error(err, `Fetch attempt ${attempt + 1} failed for remote source '${name}'`);
      if (attempt < retries) {
        log.info(`Retrying in 1 second...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  log.error(`All attempts failed for remote source '${name}'`);
  throw new Error(`Failed to fetch remote database '${name}': ${lastErr}`);
}

// Initialize all remotes from config
export async function initRemoteSources(config) {
  if (!config.remoteSources?.length) {
    log.info(`No remote sources configured`);
    return;
  }

  log.info(`Starting initialization of ${config.remoteSources.length} remote sources`);
  for (const source of config.remoteSources) {
    log.info(`Processing remote source: ${JSON.stringify(source)}`);
    try {
      const data = await fetchRemoteDatabase(source);
      remoteDb[source.name] = data;
      log.info(`Successfully stored remote database '${source.name}' in memory`);
    } catch (err) {
      log.error(err, `Failed to fetch remote source: '${source.name}'`);
    }
  }
  log.info(`Completed initialization of remote sources`);
}

// Fetch a single remote manually (ad-hoc)
export async function fetchRemote(name, url, key) {
  log.info(`Manually fetching remote: name='${name}', url='${url}', key=${key ? 'SET' : 'NONE'}`);
  const data = await fetchRemoteDatabase({ name, url, key });
  remoteDb[name] = data;
  log.info(`Stored manual fetch of remote '${name}'`);
  return data;
}

export { remoteDb };
