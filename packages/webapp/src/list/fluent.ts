const defaultOptions : IFluentOptions = {
	minHeight: 180,
	maxHeight: 220,
	width: 1024,
	padding: 10
}

export interface IFluentOptions {
	minHeight: number;
	maxHeight: number;
	width: number;
	padding: number;
}

export interface IFluentCell {
	height: number;
	width: number;
	item: any;
	items: any[],
	index: number;
}

export interface IFluentRow {
	height: number;
	columns: IFluentCell[];
}

export const fluent = (items, options) : IFluentRow[] => {
	const { minHeight, maxHeight, width, padding } = Object.assign({}, defaultOptions, options);
	
	const resize = (item, index, items) : IFluentCell => {
		const scale = maxHeight / item.height;
		return {height: maxHeight, width: +(item.width * scale).toFixed(), item, index, items}
	}

	const result = [];
	let columns = [];
	for (let i = 0; i < items.length; i++){
		const item = items[i];
		columns.push(resize(item, i, items));
		const rowWidth = columns.reduce((r, {width}) => r + width, 0);
		const rowMaxWidth = width - (columns.length + 1) * padding;
		if (rowWidth < rowMaxWidth) {
			continue;
		}

		// Shrink row
		const shinkScale = rowMaxWidth / rowWidth;
		const rowHeight = +(maxHeight * shinkScale).toFixed();
		if (rowHeight >= minHeight) {
			columns.forEach(v => {
				v.height = rowHeight;
				v.width = +(v.width * shinkScale).toFixed();
			});
			result.push({height:rowHeight, columns});
			columns = [];
			continue;
		}
		
		// single image row
		if (columns.length === 1) {
			columns[0].height = minHeight;
			columns[0].width = width - 2 * padding;
			result.push({height:minHeight, columns});
			columns = [];
			continue;
		}

		const minHeightScale = minHeight / rowHeight;

		const prevRowWidth = rowWidth - columns[columns.length - 1].width;
		const prevMaxWidth = rowMaxWidth + padding;
		const maxHeightScale = prevMaxWidth / prevRowWidth;

		if (maxHeightScale <= minHeightScale) {
			columns.pop();
			columns.forEach(v => {
				v.width = +(v.width * maxHeightScale).toFixed();
			});
			result.push({height: maxHeight, columns});
			columns = [resize(items[i], i, items)];
		} else {
			columns.forEach(v => {
				v.width = +(v.width * shinkScale).toFixed();
				v.height = minHeight;
			});
			result.push({height: minHeight, columns});
			columns = [];
		}
	}

	if (columns.length) {
		result.push({height: maxHeight, columns});
	}

	return result;
}
