import * as React from "react";
import {MediaGrid} from "./MediaGrid"
import axios from 'axios';

export interface IGridProps {
}

export class Grid2 extends React.Component<IGridProps, {}> {
    state = {
        media: []
    }

    componentDidMount() {
        axios.get(`/api`)
          .then(res => {
            const ids = [];
            const media = res.data.media.filter(m => m.year === 2019)
                .filter(m => {
                    if (ids.indexOf(m.id) < 0) {
                        ids.push(m.id);
                        return true;
                    }
                    return false;
                })
        
            media.sort((a, b) => a.date < b.date ? 1 : -1);
            this.setState({ media });
          })
      }
    

    public render(): JSX.Element {
        return (
            <>
                <MediaGrid media={this.state.media} />
            </>
        );
    }
}
