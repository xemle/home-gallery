## Debug AST

The ast can be debugged by the `debug.js` script

```
debug.js [ast|traverse|transform|transformStringify|stringify] query`
```


```
./debug.js "tag in (sea sun) year:2022 count(faces) > 2 not private"
```

Result

```
{
 "type": "query",
 "value": {
  "type": "terms",
  "value": [
   {
    "type": "inList",
    "key": "tag",
    "value": [
     {
      "type": "identifier",
      "value": "sea",
      "col": 9
     },
     {
      "type": "identifier",
      "value": "sun",
      "col": 13
     }
    ],
    "col": 1
   },
   {
    "type": "keyValue",
    "key": "year",
    "value": {
     "type": "comboundValue",
     "value": "2022",
     "col": 23
    },
    "col": 18
   },
   {
    "type": "cmpFn",
    "fn": "count",
    "key": "faces",
    "op": ">",
    "value": {
     "type": "comboundValue",
     "value": "2",
     "col": 43
    }
   },
   {
    "type": "not",
    "value": {
     "type": "identifier",
     "value": "private",
     "col": 49
    }
   }
  ],
  "col": 1
 },
 "col": 1
}
```