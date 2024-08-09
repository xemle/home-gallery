import t from 'tap'

import { filterEntriesByQuery, throwUnknownExpressions, ignoreUnknownExpressions } from './index.js'

const data = [
  {
    id: '1234567890',
    type: 'image',
    date: '2020-10-30T14:08:45',
    updated: '2022-07-03',
    width: 4000,
    height: 3000,
    country: 'Germany',
    state: 'Baden-Würtemberg',
    city: 'Heidelberg',
    road: 'Plöck',
    latitude: 49.40937,
    longitude: 8.70042,
    tags: ['foo', 'bar', 'baz', 3354]
  },
  {
    id: '0987654321',
    type: 'image',
    date: '2021-05-15T08:33:12',
    updated: '2021-05-15',
    files: [
      {id: '0987654321', index: 'ext', type: 'image', size: 2000, filename: 'vacation/sunset.JPG'},
      {id: '0987654321', index: 'ext', type: 'text', size: 100, filename: 'vacation/sunset.JPG.xmp'}
    ],
    width: 3000,
    height: 4000,
    model: 'Canon',
    make: 'A570',
    country: 'Italy',
    state: 'Puglia',
    city: 'Porto Cesareo',
    road: 'Piazza Nazario Sauro',
    latitude: 40.25730,
    longitude: 17.89156,
    tags: ['sea', 'vacation', 'sunny']
  },
  {
    id: '1223344556',
    type: 'image',
    date: '2022-12-21T21:10:22',
    updated: '2022-02-21',
    files: [
      {id: '1223344556', index: 'Pictures', type: 'image', size: 1000, filename: 'mountain.jpg'}
    ],
    tags: ['snow', 'alps', 'vacation', 'sunny']
  },
  {
    id: '6718642168',
    type: 'video',
    date: '2019-11-17T12:03:42',
    duration: 133,
    tags: ['birthday'],
    faces: [
      {x:0.6, y: 0.3, height: 0.1, width: 0.1},
      {x:0.8, y: 0.5, height: 0.1, width: 0.1}
    ],
    objects: [
      {x:0.3, y: 0.2, height: 0.2, width: 0.1, score: 0.7, class: 'couch'}
    ],
    latitude: -16.16542,
    longitude: -69.09036
  }
]

const testOptions = {
  textFn: v => [v.id.slice(0, 7), v.date, v.country, v.state, v.city, v.road, ...v.tags].join(' ').toLocaleLowerCase(),
  unknownExpressionHandler: throwUnknownExpressions
}

const execQuery = async (query, options = {}) => {
  return filterEntriesByQuery([...data], query, {...testOptions, ...options})
    .then(({entries}) => {
      return entries.map(e => e.id.slice(0, 4))
    })
}

t.test('Simple', async t => {
  t.same(await execQuery('bar'), ['1234'], 'Single Term')
  t.same(await execQuery('bar germany'), ['1234'], 'Two Terms')
})

t.test('Complex', async t => {
  t.same(await execQuery('not(bar or snow)'), ['0987', '6718'], 'not with terms')
})

t.test('or', async t => {
  t.same(await execQuery('123456 or tag:snow or year=2019'), ['1234', '1223', '6718'], 'any match with more than two')
})

t.test('and', async t => {
  t.same(await execQuery('width > 2000 and height > 1000 and country:Italy'), ['0987'], 'all match with more than two')
})

t.test('cmp', async t => {
  t.test('with year', async t => {
    t.same(await execQuery('year = 2021'), ['0987'], 'equal')
    t.same(await execQuery('year < 2021'), ['1234', '6718'], 'less than')
    t.same(await execQuery('year <= 2021'), ['1234', '0987', '6718'], 'less equal')
    t.same(await execQuery('year > 2021'), ['1223'], 'greater than')
    t.same(await execQuery('year >= 2021'), ['0987', '1223'], 'greater equal')
    t.same(await execQuery('year != 2021'), ['1234', '1223', '6718'], 'not equal')
  })

  t.test('date functions', async t => {
    t.same(await execQuery('year = 2021'), ['0987'], 'year')
    t.same(await execQuery('y = 2021'), ['0987'], 'year short')
    t.same(await execQuery('month = 10'), ['1234'], 'month')
    t.same(await execQuery('m = 10'), ['1234'], 'month short')
    t.same(await execQuery('day = 15'), ['0987'], 'day')
    t.same(await execQuery('d = 15'), ['0987'], 'day short')
    t.same(await execQuery('hour = 21'), ['1223'], 'hour')
    t.same(await execQuery('H = 21'), ['1223'], 'hour short')
    t.same(await execQuery('minute = 8'), ['1234'], 'minute')
    t.same(await execQuery('M = 8'), ['1234'], 'minute short')
  })

  t.same(await execQuery('id = 1234567890'), ['1234'], 'id with equal')
  t.same(await execQuery('id != 1234567890'), ['0987', '1223', '6718'], 'id with not equal')
  t.same(await execQuery('id ~ 5678'), ['1234'], 'id with contains')

  t.same(await execQuery('type = video'), ['6718'], 'type with equal')
  t.same(await execQuery('type != image'), ['6718'], 'type with not equal')

  t.same(await execQuery('index = Pictures'), ['1223'], 'index with equal')
  t.same(await execQuery('index != Pictures'), ['1234', '0987', '6718'], 'index with not equal')
  t.same(await execQuery('index ~ Tur'), ['1223'], 'index with contains (case insensitiv)')

  t.same(await execQuery('file ~ Tain'), ['1223'], 'file with contains (case insensitiv)')
  t.same(await execQuery('filename = sunset.JPG'), ['0987'], 'file filename')
  t.same(await execQuery('filename = sunset.jpg'), [], 'file filename case sensitive')
  t.same(await execQuery('filename ~ SUNSET.jpg'), ['0987'], 'file filename contains')
  t.same(await execQuery('path = vacation'), ['0987'], 'file path')
  t.same(await execQuery('path = VACATION'), [], 'file path case sensitive')
  t.same(await execQuery('path ~ VACATION'), ['0987'], 'file path contains (case insensitive)')
  t.same(await execQuery('ext = xmp'), ['0987'], 'file extension')
  t.same(await execQuery('ext = XMP'), ['0987'], 'file extension case insensitive')
  t.same(await execQuery('filesize > 1000'), ['0987'], 'filesize')
  t.same(await execQuery('filesize = 1000'), ['1223'], 'filesize')

  t.same(await execQuery('height > 3000'), ['0987'], 'height')
  t.same(await execQuery('width = 4000'), ['1234'], 'width')

  t.same(await execQuery('ratio > 1.2'), ['1234'], 'ratio with decimal')
  t.same(await execQuery('ratio = \'3/4\''), ['0987'], 'ratio with rational')

  t.same(await execQuery('duration > 30'), ['6718'], 'duration')
  t.same(await execQuery('duration > \'1:30\''), ['6718'], 'duration with time notation')

  t.same(await execQuery('tag = alps'), ['1223'], 'tag with equal')
  t.same(await execQuery('tag != alps'), ['1234', '0987', '6718'], 'tag with not equal')
  t.same(await execQuery('tag ~ alp'), ['1223'], 'tag with contains')

  t.same(await execQuery('object~ouch'), ['6718'], 'object with contains')

  t.test('Location keys', async t => {
    t.same(await execQuery('lat > 0'), ['1234', '0987'], 'lat alias')
    t.same(await execQuery('lon in [10:20]'), ['0987'], 'lon alias with range')
    t.same(await execQuery('latitude < 0 and longitude < 0'), ['6718'], 'negative geo values')

    t.same(await execQuery('country:germany'), ['1234'], 'country')
    t.same(await execQuery('state~baden'), ['1234'], 'state')
    t.same(await execQuery('city:heidelberg'), ['1234'], 'city')
    t.same(await execQuery('road:plöck'), ['1234'], 'road')
    t.same(await execQuery('street:plöck'), ['1234'], 'street alias of road')

    t.same(await execQuery('location:puglia'), ['0987'], 'location')
  })

})

t.test('keyValue', async t => {
  t.test('for dates', async t => {
    t.same(await execQuery('year:2021'), ['0987'], 'year')
    t.same(await execQuery('y:2021'), ['0987'], 'year short')
    t.same(await execQuery('month:10'), ['1234'], 'month')
    t.same(await execQuery('m:10'), ['1234'], 'month short')
    t.same(await execQuery('day:15'), ['0987'], 'day')
    t.same(await execQuery('d:15'), ['0987'], 'day short')
    t.same(await execQuery('hour:21'), ['1223'], 'hour')
    t.same(await execQuery('H:21'), ['1223'], 'hour short')
    t.same(await execQuery('minute:8'), ['1234'], 'minute')
    t.same(await execQuery('M:8'), ['1234'], 'minute short')
  })

  t.same(await execQuery('type:image'), ['1234', '0987', '1223'], 'image type')
  t.same(await execQuery('type:video'), ['6718'], 'video type')

  t.same(await execQuery('index:Pictures'), ['1223'], 'index')

  t.same(await execQuery('file:vacation/sunset.JPG'), ['0987'], 'file')
  t.same(await execQuery('filename:sunset.JPG'), ['0987'], 'file filename')
  t.same(await execQuery('path:vacation'), ['0987'], 'file path')
  t.same(await execQuery('ext:xmp'), ['0987'], 'file extension')

  t.same(await execQuery('width:4000'), ['1234'], 'width')
  t.same(await execQuery('height:4000'), ['0987'], 'width')

  t.same(await execQuery('ratio:panorama'), [], 'panorama')
  t.same(await execQuery('ratio:landscape'), ['1234'], 'landscape')
  t.same(await execQuery('ratio:square'), [], 'square')
  t.same(await execQuery('ratio:portrait'), ['0987'], 'portrait')

  t.same(await execQuery('tag:alps'), ['1223'], 'tag with alps')
  t.same(await execQuery('tag:3354'), ['1234'], 'number tag')

  t.same(await execQuery('object:couch'), ['6718'], 'object')
})

t.test('function cmp', async t => {
  t.same(await execQuery('count(files) > 0'), ['0987', '1223'], 'count files')
  t.same(await execQuery('count(tags) = 4'), ['1234', '1223'], 'count tags')
  t.same(await execQuery('count(faces) = 2'), ['6718'], 'count faces')
  t.same(await execQuery('count(objects) = 1'), ['6718'], 'count objects')
})

t.test('function exists', async t => {
  t.same(await execQuery('exists(files)'), ['0987', '1223'], 'exists files')
  t.same(await execQuery('exists(latitude)'), ['1234', '0987', '6718'], 'exists latitude')
  t.same(await execQuery('exists(location)'), ['1234', '0987'], 'exists alias location')
  t.same(await execQuery('exists(geo)'), ['1234', '0987', '6718'], 'exists alias geo')
})

t.test('in list', async t => {
  t.same(await execQuery('tags in (sea)'), ['0987'], 'single tag')
  t.same(await execQuery('tags in (sea, alps)'), ['0987', '1223'], 'multiple tags')
  t.same(await execQuery('tags in (sea, Alps)'), ['0987', '1223'], 'multiple tags case insensitive')
  t.same(await execQuery('tags in (3354)'), ['1234'], 'non string tags')
})

t.test('all in list', async t => {
  t.same(await execQuery('tags all in (sea)'), ['0987'], 'single tag')
  t.same(await execQuery('tags all in (vacation, Sea)'), ['0987'], 'multiple tags case insensitive')
  t.same(await execQuery('tags all in (vacation, sunny, Sunny)'), ['0987', '1223'], 'multiple duplicated tags')
})

t.test('in range', async t => {
  t.test('for dates', async t => {
    t.same(await execQuery('year in [2021:2022]'), ['0987', '1223'], 'year')
    t.same(await execQuery('y in [2021:2022]'), ['0987', '1223'], 'year short')
    t.same(await execQuery('month in [1:6]'), ['0987'], 'year')
    t.same(await execQuery('m in [1:6]'), ['0987'], 'month short')
    t.same(await execQuery('day in [15:20]'), ['0987', '6718'], 'day')
    t.same(await execQuery('d in [15:20]'), ['0987', '6718'], 'day short')
    t.same(await execQuery('hour in [12:24]'), ['1234', '1223', '6718'], 'hour')
    t.same(await execQuery('H in [12:24]'), ['1234', '1223', '6718'], 'hour short')
    t.same(await execQuery('minute in [0:30]'), ['1234', '1223', '6718'], 'minute')
    t.same(await execQuery('M in [0:30]'), ['1234', '1223', '6718'], 'minute short')
  })

  t.same(await execQuery('filesize in [1000:2000]'), ['0987', '1223'], 'filesize')
  t.same(await execQuery('filesize in [1k:2kb]'), ['0987'], 'filesize')
})

t.test('order by', async t => {
  t.same(await execQuery('order by updated'), ['1234', '1223', '0987', '6718'], 'by updated')
  t.same(await execQuery('year >= 2021 order by updated'), ['1223', '0987'], 'by updated')
  t.same(await execQuery('order by updated asc'), ['6718', '0987', '1223', '1234'], 'by updated asc')
  t.same(await execQuery('order by updated desc'), ['1234', '1223', '0987', '6718'], 'by updated desc')
  t.resolves(execQuery('order by random'), 'by random')

  t.same(await execQuery('order by count(files)'), ['0987', '1223', '1234', '6718'], 'by count files')
  t.same(await execQuery('order by count(tags)'), ['1223', '1234', '0987', '6718'], 'by count tags')
})

t.test('Not yet implemented', async t => {
  t.rejects(execQuery('foo:bar'), 'key:value')
  t.rejects(execQuery('foo >= bar'), 'Compare')
  t.rejects(execQuery('foo in (bar, baz)'), 'List')
  t.rejects(execQuery('foo in [2019:2021]'), 'Range')
})

t.test('unknownExpressionHandler', async t => {
  t.same(await execQuery('foo:bar baz', {unknownExpressionHandler: ignoreUnknownExpressions}), ['1234'], 'Allow all fallback')
})
