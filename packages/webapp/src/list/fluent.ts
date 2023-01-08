const defaultOptions : IFluentOptions = {
	minHeight: 180,
	maxHeight: 220,
	maxPotraitHeight: 250,
	width: 1024,
	padding: 10
}

export interface IFluentOptions {
	minHeight: number;
	maxHeight: number;
	maxPotraitHeight: number;
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
	top: number;
	columns: IFluentCell[];
}

class EqualHeightRow {
	items = []
	indices : number[] = []
	ratios: number[] = []
	ratioSum = 0

	constructor(items: []) {
		this.items = items
	}

	add(index: number) {
		const item = this.items[index]
		if (!item) {
			return
		}
		const { width, height } = item
		const ratio = width / height
		this.indices.push(index)
		this.ratios.push(ratio)
		this.ratioSum += ratio
	}

	pop() {
		this.indices.pop()
		const ratio = this.ratios.pop()
		if (ratio) {
			this.ratioSum -= ratio
		}
	}

	get length() {
		return this.indices.length
	}

	get avgRatio() {
		if (!this.indices.length) {
			return 0
		}
		return this.ratioSum / this.ratios.length
	}

	getWidthForHeight(targetHeight: number) {
		return this.ratioSum * targetHeight
	}

	getFluentRow(targetHeight : number, targetWidth = -1) : IFluentRow {
		const items = this.items
		const ratios = this.ratios

		// cells with equal height
		const cells : IFluentCell[] = this.indices.map((index, i) => {
			const item = items[index]
			const ratio = ratios[i]
			return { width: +(targetHeight * ratio).toFixed(), height: +targetHeight.toFixed(), item, index, items }
		})

		if (targetWidth < 0) {
			return {height: targetHeight, top: 0, columns: cells}
		}

		// scale cells widths to target width
		const widthSum = cells.reduce((widthSum, {width}) => widthSum + width, 0)
		const widthScale = targetWidth / widthSum
		cells.forEach(cell => cell.width = +(cell.width * widthScale).toFixed())

		return {height: targetHeight, top: 0, columns: cells}
	}
}

export const fluent = (items, options) : IFluentRow[] => {
	const { minHeight, maxHeight, maxPotraitHeight, width, padding } = Object.assign({}, defaultOptions, options);

	const result : IFluentRow[] = [];
	let row = new EqualHeightRow(items);
	let lastRowMaxWidth = 0;
	let lastRowWidth = 0;
	let lastTargetHeight = 0;
	for (let i = 0; i < items.length; i++){
		row.add(i)
		const rowMaxWidth = width - (row.length + 1) * padding;
		const avgRatio = row.avgRatio
		const targetHeight = avgRatio < 1 ? maxPotraitHeight : maxHeight;
		const rowWidth = row.getWidthForHeight(targetHeight)
		if (rowWidth < rowMaxWidth) {
			lastRowMaxWidth = rowMaxWidth;
			lastRowWidth = rowWidth;
			lastTargetHeight = targetHeight;
			continue;
		}

		// Shrink row
		const shinkScale = rowMaxWidth / rowWidth;
		const rowHeight = +(targetHeight * shinkScale).toFixed();
		if (rowHeight >= minHeight) {
			result.push(row.getFluentRow(rowHeight, rowMaxWidth));
			row = new EqualHeightRow(items);
			continue;
		}

		// single image row
		if (row.length === 1) {
			result.push(row.getFluentRow(minHeight, rowMaxWidth));
			row = new EqualHeightRow(items);
			continue;
		}

		const lastScale = lastRowWidth / lastTargetHeight
		const curScale = rowWidth / minHeight

		if (lastScale < curScale) {
			// use last row and reset current item
			row.pop()
			i--
			result.push(row.getFluentRow(lastTargetHeight, lastRowMaxWidth));
			row = new EqualHeightRow(items);
		} else {
			result.push(row.getFluentRow(minHeight, rowMaxWidth));
			row = new EqualHeightRow(items);
		}
	}

	if (row.length) {
		result.push(row.getFluentRow(lastTargetHeight));
	}

	let lastTop = 0
	result.forEach(row => {
		row.top = lastTop
		lastTop += row.height + padding
	})

	return result;
}
