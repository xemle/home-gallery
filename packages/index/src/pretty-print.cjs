const { humanize } = require('@home-gallery/common')

function perCent(value, max) {
  return (100 * value / max).toFixed(1)
}

function spaces(count) {
  let result = '';
  while (result.length < count) {
    result += ' ';
  }
  return result;
}

// type, count (%), size (%)
function prettyPrint(stats) {
  const table = [];
  table.push(['type', 'count', '', 'size', '']);
  table.push(['directories:', stats.directories, '', '', '']);
  table.push(['files:', stats.files, '', humanize(stats.totalSize), '']);

  const types = Object.keys(stats.fileTypes);
  types.sort((a, b) => stats.fileTypes[b].size - stats.fileTypes[a].size);
  types.forEach(type => {
    const typeStat = stats.fileTypes[type];
    table.push([type, `${typeStat.count}`, `${perCent(typeStat.count, stats.files)}%`, ` ${humanize(typeStat.size)}`, `${perCent(typeStat.size, stats.totalSize)}%`])
  })
  table.push(['symbolic links:', stats.symbolicLinks, '', '', '']);
  table.push(['others:', stats.others, '', '', '']);

  const colSize = [0, 0, 0, 0, 0];
  table.forEach(row => {
    row.forEach((cell, index) => {
      colSize[index] = Math.max(cell.toString().length, colSize[index])
    })
  })

  return table.map(row => {
    return row.map((cell, index) => {
      if (index > 0) {
        return `${spaces(colSize[index] - cell.toString().length)}${cell}`;
      } else {
        return `${cell}${spaces(colSize[index] - cell.toString().length)}`;
      }
    }).join('  ');
  }).join('\n');
}

module.exports = {
  prettyPrint
}