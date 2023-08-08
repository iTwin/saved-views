/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { ViewDefinitionProps } from "@itwin/core-common";
import { LoadingSpinner, type CommonProps } from "@itwin/core-react";
import * as React from "react";
import { connect, type ConnectedProps } from "react-redux";

import { ThumbnailCache } from "../../../api/caches/ThumbnailCache";
import { SavedViewsManager } from "../../../api/SavedViewsManager";
import { type SavedViewsState } from "../../../store/SavedViewsStateReducer";

import "./ViewItem.scss";

/** ViewItem widget props */
export interface ViewItemProps extends CommonProps {
  /** View definition */
  viewProps: ViewDefinitionProps;
  /** Show hover indicator */
  showHoverIndicator?: boolean;
  /** Called when the view is clicked */
  onClick: (viewProps: ViewDefinitionProps) => void;
}

/** ViewItem widget state */
interface ViewItemState {
  thumbnail: string | undefined;
  waitingForThumbnail: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapState = (rootState: any) => {
  const state: SavedViewsState =
    rootState[SavedViewsManager.savedViewsStateKey];

  const connection = state.iModel;
  const showThumnbails = state.showThumbnails;

  return {
    showThumnbails,
    connection,
  };
};

const connector = connect(mapState, {});

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & ViewItemProps;

/** Button containing thumbnail and view name */
class ViewItem extends React.PureComponent<Props, ViewItemState> {
  private _unmounted = false;

  constructor(props: Props) {
    super(props);

    this.state = { thumbnail: undefined, waitingForThumbnail: true };
  }

  /** Load thumbnail from the iModelConnection if necessary */
  public override async componentDidMount() {
    const iModelConnection = this.props.connection;

    if (this.props.showThumnbails) {
      const thumbnail = await ThumbnailCache.getThumbnail(iModelConnection!, this.props.viewProps);
      if (thumbnail) {
        const blob = new Blob([thumbnail!.image], {
          type: "image/" + thumbnail!.format,
        });
        // Load thumbnails
        if (!this._unmounted) {
          this.setState({ thumbnail: URL.createObjectURL(blob) });
        }
      }
    }

    if (!this._unmounted) {
      this.setState({ waitingForThumbnail: false });
    }
  }

  public override componentWillUnmount() {
    this._unmounted = true;
  }

  public get viewDefinition(): ViewDefinitionProps {
    return this.props.viewProps;
  }

  private _onClick = () => {
    this.props.onClick(this.props.viewProps);
  };

  public renderThumbnail() {
    if (this.state.waitingForThumbnail) {
      return <LoadingSpinner />;
    } else if (this.state.thumbnail === undefined) {
      return (
        <>
          <svg
            className="no-thumbnail"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            enableBackground="new 0 0 16 16"
          >
            <g>
              <path d="M10.3 5.9 7.7 9.3 6 7.6 3 11 13 11z" />
              <circle cx="4.4" cy="5.9" r="1.3" />
              <path d="M0,2v12h16V2H0z M14,12H2V4h12V12z" />
            </g>
          </svg>
          {
            <span
              className="icon icon-imodel-hollow-2 imodel-view-icon"
              title={SavedViewsManager.translate("viewListComponent.sourceView")}
            />
          }
        </>
      );
    } else {
      return (
        <>
          <img src={this.state.thumbnail} />
          {
            <span
              className="icon icon-imodel-hollow-2 imodel-view-icon"
              title={SavedViewsManager.translate("viewListComponent.sourceView")}
            />
          }
          {this.props.showHoverIndicator && <span className="open">Open</span>}
        </>
      );
    }
  }

  public override render() {
    const label = this.props.viewProps.userLabel
      ? this.props.viewProps.userLabel
      : this.props.viewProps.code.value;
    return (
      <>
        <div
          className={`itwin-saved-views-view-list-item-thumbnail ${this.props.className}`}
          style={this.props.style}
          onClick={this._onClick}
        >
          <div className="itwin-saved-views-view-item-thumbnail-container">
            {this.renderThumbnail()}
          </div>
          <div
            className="itwin-saved-views-view-item-label-thumbnail"
            title={label}
          >
            <span className="label">{label}</span>
          </div>
        </div>
      </>
    );
  }
}

export default connector(ViewItem);
