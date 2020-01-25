import * as React from "react";
import {
    Link,
    useLocation
} from "react-router-dom";

export interface IMediaProps {
    media: any[];
    index: number
    style: any;
    size: number;
}

export const Media = (props: IMediaProps) => {
    const location = useLocation();
    const { index, media } = props;
    const {id, width, height, date, files, previews, type} = media[index];
    const imgStyle = {
        'maxHeight': props.size
    }

    const linkState = {
        uppathname: location.pathname
    }

    let preview = <img src={'/files/' + previews.filter(p => p.match(/image-preview-320/)).pop()} style={imgStyle}/>

    return (
        <>
            <div className={`media media--${type} media--${props.size}`} style={props.style}>
                <div className={`media__preview`} >
                    <Link to={{pathname:`/view/${id}`, state: linkState}}>
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
