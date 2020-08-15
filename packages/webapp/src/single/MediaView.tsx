import * as React from "react";
import { useRef, useLayoutEffect } from "react";
import {
  BrowserRouter as Router,
  useParams,
  useLocation,
  useHistory
} from "react-router-dom";
import Hammer from 'hammerjs';

import { useStoreState, useStoreActions } from '../store/hooks';
import useListPathname from './useListPathname';

import { MediaNav } from './MediaNav';
import { MediaViewUnknownType } from './MediaViewUnknownType';
import { MediaViewImage } from './MediaViewImage';
import { MediaViewVideo } from './MediaViewVideo';
import { Zoomable } from "./Zoomable";
import useBodyDimensions from "../utils/useBodyDimensions";

const findEntryIndex = (location, entries, id) => {
  if (location.state && location.state.index) {
    return location.state.index;
  }
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].id === id) {
      return i;
    }
  }
  return -1;
}

const scaleDimensions = (media, device) => {
  if (!media) {
    return { width: device.width, height: device.height }
  }
  const mediaRatio = media.height / (media.width || 1);
  const deviceRatio = device.height / (device.width || 1);
  if (deviceRatio < mediaRatio) {
    return { width: device.height / mediaRatio, height: device.height }
  } else {
    return { width: device.width, height: device.width * mediaRatio }
  }
}

export const MediaView = () => {
  let { id } = useParams();
  let location = useLocation();
  const history = useHistory();
  const listPathname = useListPathname();
  const dimensions = useBodyDimensions();

  const entries = useStoreState(state => state.entries.entries);
  const allEntries = useStoreState(state => state.entries.allEntries);
  const setEntries = useStoreActions(store => store.entries.setEntries);

  let index = findEntryIndex(location, entries, id);

  const media = entries[index];
  const prev = entries[index - 1];
  const next = entries[index + 1];

  /*
  const ref = useRef();
  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const element = ref.current;
    const mc = new Hammer.Manager(element, {
      recognizers: [
        [Hammer.Swipe,{ direction: Hammer.DIRECTION_ALL }]
      ]
    });

    mc.on('swiperight', () => prev && history.push(`/view/${prev.id}`, { listPathname, index: index - 1 }));
    mc.on('swipeleft', () => next && history.push(`/view/${next.id}`, { listPathname, index: index + 1 }));
    mc.on('swipeup', () => history.push(listPathname));

    return () => {
      if (!mc) {
        return;
      }
      mc.stop(false);
      mc.destroy();
    }
  });
  */

  const isImage = media && (media.type === 'image' || media.type === 'rawImage');
  const isVideo = media && (media.type === 'video')
  const isUnknown = !media || (['image', 'rawImage', 'video'].indexOf(media.type) < 0)

  const key = media ? media.id : (Math.random() * 100000).toFixed(0);
  const scaleSize = scaleDimensions(media, dimensions);
  console.log(scaleSize, dimensions, media);

  const getSimilarRef = (hash) => {
    const result = [];
    for (let i = 0; i < hash.length; i++) {
      let value = hash[i];
      let shift = 0;
      while (shift < 24) {
        const v = value & 3;
        result.push(v);
        shift++;
        value = value >> 2;
      }
    }
    return result;
  }

  const getSqrtDenA = values => {
    return values.map(v => v * v / 9).reduce((r, v) => r + v)
  }

  const cosineSimilarity2 = (ref, sqrtDenA, b) => {
    let denB = 0;
    let num = 0;
    let iRef = 0;
    for (let i = 0; i < b.length; i++) {
      let bi = b[i];
      let shift = 0;
      while (shift < 24) {
        const av = ref[iRef++];
        const bv = bi & 3;
        num += av * bv / 9;
        denB += bv * bv / 9;

        shift++;
        bi = bi >> 2;
      }
    }

    return num / (sqrtDenA * Math.sqrt(denB));
  }

  const cosineSimilarity = (a, b) => {
    let denA = 0;
    let denB = 0;
    let num = 0;
    for (let i = 0; i < a.length; i++) {
      let ai = a.charCodeAt(i) & 255;
      let bi = b.charCodeAt(i) & 255;
      for (let j = 0; j < 4; j++) {
        let av = (ai & 3);
        let bv = (bi & 3);
        av = av * av / 9;
        bv = bv * bv / 9;
        num += av * bv;
        denA += av * av;
        denB += bv * bv;

        ai = (ai >> 2);
        bi = (bi >> 2);
      }
    }

    return num / (Math.sqrt(denA) * Math.sqrt(denB));
  }

  const searchHandler = () => {
    if (!media.similarityHash) {
      return
    }
    const t0 = Date.now();
    const comparableEntries = Array.from(allEntries.values()).filter(entry => !!entry.similarityHash);
    const t1 = Date.now()
    const similar = comparableEntries.map(entry => {
      return {
        entry,
        similarity: cosineSimilarity(media.similarityHash, entry.similarityHash)
      }
    })
    .filter(item => item.similarity > 0.5)
    const t2 = Date.now();
    similar.sort((a, b) => (a.similarity - b.similarity) < 0 ? 1 : -1);
    const entries = similar.map(s => s.entry);
    const t3 = Date.now();
    console.log(`Took ${t1 - t0}ms to select, ${t2 - t1}ms to calculate, to sort ${t3 - t2}ms, to map ${Date.now() - t3}ms similar pictures`);
    history.push('/');
    setEntries(entries);
  }

  return (
    <>
      <MediaNav index={index} prev={prev} next={next} listPathname={listPathname} onSearch={searchHandler} />
      {isImage &&
        <Zoomable key={key} width={scaleSize.width} height={scaleSize.height}>
          <MediaViewImage key={key} media={media} next={next} prev={prev}/>
        </Zoomable>
      }
      {isVideo &&
        <MediaViewVideo key={key} media={media} next={next} prev={prev}/>
      }
      {isUnknown &&
        <MediaViewUnknownType key={key} media={media} next={next} prev={prev}/>
      }
    </>
  )
}

