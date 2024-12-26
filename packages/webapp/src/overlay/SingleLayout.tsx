import * as React from "react";

export const SingleLayout = ((props) => {

	if (!props.entries) {
		return <></>;
	}

	return (
		<>
		<img className="absolute object-contain w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src={props.entries[0]} />
		</>
	)
})