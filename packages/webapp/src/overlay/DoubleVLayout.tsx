import * as React from "react";

export const DoubleVLayout = ((props) => {

	if (!props.entries) {
		return <></>;
	}

	return (
		<>
		<div className="w-screen h-screen flex">
			<div className="flex-1">
			<img className="relative object-contain h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src={props.entries[0]} />
			</div>
			<div className="flex-1">
			<img className="relative object-contain h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src={props.entries[1]} />
			</div>
		</div>
		</>
	)
})