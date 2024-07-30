import { dateKeyAliases, geoKeyAliasMap, textKeyAliasMap } from "./ast-aliases.js"

export const dateKeys = [
  ...Object.values(dateKeyAliases)
]

export const numericKeys = [
  ...dateKeys,
  ...Object.values(geoKeyAliasMap),
  'filesize',
  'height',
  'width',
  'ratio',
  'duration',
  'iso'
]

export const rangeKeys = [
  ...numericKeys,
  'date'
]

export const textKeys = [
  ...Object.values(textKeyAliasMap),
  'id',
  'type',
  'index',
  'file',
  'filename',
  'path',
  'ext',
  'model',
  'make',
  'country',
  'state',
  'city',
  'tag',
  'object'
]
