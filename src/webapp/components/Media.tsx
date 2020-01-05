import * as React from "react";
import {
    Link
} from "react-router-dom";

export interface IMediaProps {
    media: any;
    style: any;
    size: number;
}

export const Media = (props: IMediaProps) => {
    const {id, width, height, date, files, previews, type} = props.media;
    const imgStyle = {
        'maxHeight': props.size
    }

    let preview = <img src={'/files/' + previews.filter(p => p.match(/image-preview-320/)).pop()} style={imgStyle}/>

    return (
        <>
            <div className={`media media--${type} media--${props.size}`} style={props.style}>
                <div className={`media__preview`} >
                    <Link to={`/view/${id}`}>
                        {preview}
                    </Link>
                </div>
                <div className="media__description">
                    <p>{files[0].filename.replace(/.*\//, '')}</p>
                    <p>{date.replace('T', ' ').substr(0, 19)}</p>
                    <p>{width}x{height}</p>
                </div>
            </div>
        </>
    );
}
