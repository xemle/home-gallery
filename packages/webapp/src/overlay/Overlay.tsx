import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as icons from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef } from "react";
import { useEntryStore } from "../store/entry-store";
import { usePreviewSize } from "../single/usePreviewSize";
import { getHigherPreviewUrl } from '../utils/preview';

const SlideShow = ({closeCb}) => {
	const divRef = useRef<HTMLDivElement>(null);
	const entries = useEntryStore(state => state.entries);
	const entryTimeout = 10 * 1000; // TODO: move to a configuration
	const getRandomIdx = () => Math.floor(Math.random() * entries.length);
	const previewSize = usePreviewSize();
	const [largeUrlState, setLargeUrlState] = useState('');

	const selectNewEntry = () => {
		const entry = entries[getRandomIdx()];

		const largeUrl = getHigherPreviewUrl(entry.previews, previewSize);
		setLargeUrlState(largeUrl || '');
	}

	const createInterval = () => {
		return setInterval(() => {
			selectNewEntry();
		}, entryTimeout)
	}

	const onDivClick = (event) => {
		event.preventDefault();
		// TODO: reset interval so the new entry lasts the full timeout
		selectNewEntry();
	}

	useEffect(() => {
		if (divRef.current === null) {
			return;
		}
		divRef.current.focus();
	}, [divRef.current]);

	useEffect(() => {
		selectNewEntry();
		let timer = createInterval();

		return () => {
			clearTimeout(timer);
		}
	}, []);

	const divKeyUp = (event) => {
		if (event.key !== 'Escape') {
			return;
		}
		closeCb();
	}

	return (
		<div ref={divRef} className={`fixed top-0 z-50 bg-black h-full w-full`} tabIndex={0} onKeyUp={divKeyUp} onClick={onDivClick}>
			<img className="absolute object-contain w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src={largeUrlState} />
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