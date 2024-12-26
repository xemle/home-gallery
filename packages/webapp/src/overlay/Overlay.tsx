import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as icons from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef } from "react";
import { useEntryStore } from "../store/entry-store";
import { usePreviewSize } from "../single/usePreviewSize";
import { getHigherPreviewUrl } from '../utils/preview';
import { SingleLayout } from "./SingleLayout";
import { DoubleVLayout } from "./DoubleVLayout";

const SlideShow = ({closeCb}) => {
	const divRef = useRef<HTMLDivElement>(null);
	const entries = useEntryStore(state => state.entries);
	const entryTimeout = 10 * 1000; // TODO: move to a configuration
	const getRandomIdx = () => Math.floor(Math.random() * entries.length);
	const previewSize = usePreviewSize();
	const layoutHistory = useRef<any[]>([]);
	const [currentLayout, setCurrentLayout] = useState<any>(null);
	const [nextLayout, setNextLayout] = useState<any>(null);
	const [isFading, setIsFading] = useState(false);
	const [nextIdx, setNextIdx] = useState(0);

	const selectNewEntry = () => {
		const entry = entries[getRandomIdx()];
		return getHigherPreviewUrl(entry.previews, previewSize);
	}

	const getLayoutComponent = (name: string, entries: any[]) => {
		switch (name) {
			case 'SingleLayout':
				return <SingleLayout entries={entries} />;
			case 'DoubleVLayout':
				return <DoubleVLayout entries={entries} />;
		
			default:
				break;
		}
	}

	const selectNewLayout = (idx: number) => {
		// TODO: Move to the each *Layout.tsx file to have the data in one place
		const layouts = [
			{name: 'SingleLayout', entriesCount: 1},
			{name: 'DoubleVLayout', entriesCount: 2},
		];

		const history = layoutHistory.current;
		if (idx >= 0 && idx < history.length) {
			const layoutFromHistory = history[idx];
			const newLayoutComponent = getLayoutComponent(layoutFromHistory.component, layoutFromHistory.entries);
			setNextLayout(newLayoutComponent);
			return Math.min(idx + 1, layoutHistory.current.length);
		}

		const {name: newLayoutName, entriesCount} = layouts[Math.floor(Math.random() * layouts.length)];
		const newLayoutData: any = {
			component: newLayoutName,
			entries: []
		};

		for (let index = 0; index < entriesCount; index++) {
			newLayoutData.entries.push(selectNewEntry());
		}
		const newLayoutComponent = getLayoutComponent(newLayoutName, newLayoutData.entries);

		layoutHistory.current.push(newLayoutData);
		setNextLayout(newLayoutComponent);
		return layoutHistory.current.length;
	}

	const transitionEnd = () => {
		setCurrentLayout(nextLayout);
		setIsFading(false);
		setNextIdx(selectNewLayout(nextIdx));
	}

	const createInterval = () => {
		return setInterval(() => {
			setIsFading(true);
		}, entryTimeout)
	}

	const onDivClick = (event) => {
		event.preventDefault();
		// TODO: reset interval so the new entry lasts the full timeout
		setIsFading(true);
	}

	useEffect(() => {
		if (divRef.current === null) {
			return;
		}
		divRef.current.focus();
	}, [divRef.current]);

	useEffect(() => {
		setNextIdx(selectNewLayout(nextIdx));
		setIsFading(true);
		let timer = createInterval();

		return () => {
			clearTimeout(timer);
		}
	}, []);

	const divKeyUp = (event) => {
		switch (event.key) {
			case 'Escape':
				closeCb();
				break;
			case 'ArrowLeft':
				setNextIdx(selectNewLayout(Math.max(nextIdx - 3, 0)));
				setIsFading(true);
				break;
			case ' ':
			case 'ArrowRight':
				setNextIdx(selectNewLayout(Math.min(nextIdx - 1, layoutHistory.current.length)));
				setIsFading(true);
				break;
		
			default:
				break;
		}
		
	}

	return (
		<div ref={divRef} className={`fixed top-0 z-50 bg-black h-full w-full`} tabIndex={0} onKeyUp={divKeyUp} onClick={onDivClick}>
			<div className={`absolute top-0 h-full w-full z-50 ${isFading ? 'toFadeOut fadeOut' : 'opacity-1'}`} onTransitionEnd={transitionEnd}>
				{currentLayout}
			</div>
			<div className={`absolute top-0 h-full w-full z-40 ${isFading ? 'toFadeIn fadeIn' : 'opacity-0'}`}>
				{nextLayout}
			</div>
			<div className={`absolute top-0 h-full w-full z-40 ${isFading ? 'hidden' : ''}`}>
				{currentLayout}
			</div>
		</div>
	)
}

export const Fab = () => {
	const [slideShowActive, setslideShowActive] = useState(false)

	const toogleSlideShow = () => {
		setslideShowActive(!slideShowActive)
	}
	return (
		<>
		{slideShowActive ? <SlideShow closeCb={toogleSlideShow}/> : null}
		<div className="bg-primary h-16 w-16 rounded-full p-0.5 rounded-br-md fixed bottom-5 right-5 flex items-center justify-center cursor-pointer">
			<div
				onClick={toogleSlideShow}
				className={`rounded-full w-full h-full flex items-center justify-center`}
			>
				<FontAwesomeIcon icon={icons.faTv} className="text-gray-300"/>
			</div>
		</div>
		</>
	)
}