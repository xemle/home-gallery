## Print AST

```
node -e "require('./dist/parser').parse('tag in (sea sun) year:2022 count(faces) > 2 not private', (e, ast) => console.log(JSON.stringify(ast, null, 2)))"
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
          "type": "value",
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
          "type": "value",
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
  "sortBy": false
}
```