const Logger = require('@home-gallery/logger')

const log = Logger('database.entry-group')

const { uniqBy, toMultiValueMap } = require('./utils.cjs')

const hasFirstShorterFilename = (a, b) => a.files[0].filename <= b.files[0].filename

const getUniqFileSizeSum = a => a.files.filter(uniqBy(e => e.id)).map(e => e.size).reduce((r, v) => r + v, 0)

const compareUniqFileSizeSum = (a, b) => getUniqFileSizeSum(b) - getUniqFileSizeSum(a)

const isFirstPrimary = (a, b) => {
  const sizeSumCmp = compareUniqFileSizeSum(a, b)
  if (sizeSumCmp == 0) {
    return hasFirstShorterFilename(a, b)
  }
  return sizeSumCmp < 0
}

const toNewEntry = ([_, newEntry]) => newEntry

const getGroupId = (type, entry) => `${type}@${entry.id}`

const getGroupIdForId = entry => getGroupId('id', entry)

const splitGroupId = groupId => groupId.split('@')

const hasGroupIds = entry => entry.groupIds && entry.groupIds.length

const hasAnyGroupId = (entry, groupIds) => {
  if (!hasGroupIds(entry)) {
    return false
  }
  return !!entry.groupIds.find(groupId => groupIds.includes(groupId))
}

const addGroupId = (entry, groupId) => {
  if (!hasGroupIds(entry)) {
    entry.groupIds = [groupId]
    return true
  } else if (!entry.groupIds.includes(groupId)) {
    entry.groupIds.push(groupId)
    return true
  }
  return false
}

const removeGroupId = (entry, groupId) => {
  if (!hasGroupIds(entry)) {
    return false
  }
  const index = entry.groupIds.findIndex(g => g == groupId)
  if (index < 0) {
    return false
  }
  return entry.groupIds.splice(index, 1)
}

const copyGroupIds = entry2newEntry => {
  return entry2newEntry.reduce((changedEntries, [entry, newEntry]) => {
    if (!hasGroupIds(entry)) {
      return changedEntries
    }

    if (!hasGroupIds(newEntry)) {
      newEntry.groupIds = [...entry.groupIds]
      changedEntries.push(newEntry)
    } else {
      entry.groupIds.forEach(groupId => addGroupId(newEntry, groupId) && changedEntries.push(newEntry))
    }
    return changedEntries
  }, [])
}

const hasGroups = entry => entry.groups && entry.groups.length

const isNewGroup = ([entry, newEntry]) => entry.id != newEntry.id && hasGroups(entry)

const findGroupChanges = entry2newEntry => entry2newEntry
  .filter(isNewGroup)
  .reduce((result, [entry, newEntry]) => {
    const oldGroupId = getGroupIdForId(entry)
    const newGroupId = getGroupIdForId(newEntry)
    log.debug(`Migrate group ${oldGroupId} to ${newGroupId}`)
    result[oldGroupId] = newGroupId
    return result
  }, {})

const mergeGroups = (entry2newEntry, entries) => {
  const changedEntries = copyGroupIds(entry2newEntry)

  const groupId2newGroupId = findGroupChanges(entry2newEntry)
  const oldGroupIds = Object.keys(groupId2newGroupId)
  if (!oldGroupIds.length) {
    return changedEntries
  }

  const hasOldGroupId = entry => hasAnyGroupId(entry, oldGroupIds)

  const mapGroupId = entry => {
    Object.entries(groupId2newGroupId).forEach(([oldGroupId, newGroupId]) => {
      if (removeGroupId(entry, oldGroupId) && addGroupId(entry, newGroupId)) {
        changedEntries.push(entry)
      }
    })
  }

  entries.filter(hasOldGroupId).forEach(mapGroupId)
  entry2newEntry.map(toNewEntry).filter(hasOldGroupId).forEach(mapGroupId)

  return changedEntries
}

const groupEntriesById = (newEntries, entries = []) => {
  const changedEntries = []
  const id2entries = toMultiValueMap(entries)
  toMultiValueMap(newEntries, id2entries)

  newEntries
    .filter(entry => id2entries[entry.id].length > 1)
    .filter(uniqBy(entry => entry.id))
    .forEach(entry => {
      const list = id2entries[entry.id]
      list.sort((a, b) => isFirstPrimary(a, b) ? -1 : 1)

      const primary = list[0]
      const groupId = getGroupIdForId(primary)
      list.slice(1).forEach(entry => addGroupId(entry, groupId) && changedEntries.push(entry))
      removeGroupId(primary, groupId) && changedEntries.push(entry)
    })

  Object.values(id2entries)
    .filter(entries => entries.length == 1)
    .map(entries => entries[0])
    .forEach(entry => removeGroupId(entry, getGroupIdForId(entry)) && changedEntries.push(entry))

  return changedEntries
}

module.exports = {
  mergeGroups,
  groupEntriesById
}