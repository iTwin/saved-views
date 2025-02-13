/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgImodelHollow, SvgProject } from "@itwin/itwinui-icons-react";
import { FluidGrid, PageLayout } from "@itwin/itwinui-layouts-react";
import { Surface, Text, Tile } from "@itwin/itwinui-react";
import { type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { applyUrlPrefix } from "../../environment.js";
import { useAuthorization } from "../Authorization.js";
import { ITwin, callITwinApi } from "../ITwinApi.js";
import { Paginator } from "./Paginator.js";

import "./ITwinBrowser.css";

export function ITwinBrowser(): ReactElement {
  const { authorizationClient } = useAuthorization();

  const fetchITwins = (url: string) => callITwinApi(
    {
      url,
      additionalHeaders: { Prefer: "return=representation" },
      postProcess: (response) => response.json(),
    },
    { authorizationClient },
  );

  const navigate = useNavigate();

  return (
    <PageLayout.Content padded>
      <div style={{ display: "grid", gap: "var(--iui-size-xl)" }}>
        <div style={{ display: "grid", grid: "1fr / auto 1fr" }}>
          <Tile.Wrapper style={{ margin: "var(--iui-size-l)", width: "calc(10 * var(--iui-size-l))" }}>
            <Tile.ThumbnailArea style={{ height: "calc(5 * var(--iui-size-l))" }}>
              <Tile.ThumbnailPicture>
                <SvgImodelHollow />
              </Tile.ThumbnailPicture>
            </Tile.ThumbnailArea>
            <Tile.Name>
              <Tile.NameLabel>
                <Tile.Action onClick={() => navigate("/itwinjs/open-blank-connection")}>
                  Open  blank connection
                </Tile.Action>
              </Tile.NameLabel>
            </Tile.Name>
          </Tile.Wrapper>
          <Surface style={{ padding: "var(--iui-size-l)" }}>
            <div style={{ display: "grid", gap: "var(--iui-size-m)" }}>
              <Text variant="title">Recent</Text>
              <Paginator
                initialUrl={applyUrlPrefix("https://api.bentley.com/itwins/recents?subclass=Project&$top=5")}
                fetch={fetchITwins}
              >
                {(result) => <ITwinTileGrid iTwins={result.iTwins} />}
              </Paginator>
            </div>
          </Surface>
        </div>
        <div style={{ display: "grid", gap: "var(--iui-size-m)" }}>
          <Text variant="title">All iTwins</Text>
          <Paginator
            initialUrl={applyUrlPrefix("https://api.bentley.com/itwins?subclass=Project")}
            fetch={fetchITwins}
          >
            {(result) => <ITwinTileGrid iTwins={result.iTwins} />}
          </Paginator>
        </div>
      </div>
    </PageLayout.Content>
  );
}

interface ITwinTileGridProps {
  iTwins: ITwin[];
}

function ITwinTileGrid(props: ITwinTileGridProps): ReactElement {
  const navigate = useNavigate();

  return (
    <FluidGrid className="itwin-tile-grid">
      {
        props.iTwins.map((iTwin) => (
          <Tile
            key={iTwin.id}
            name={iTwin.displayName}
            variant="folder"
            isActionable
            thumbnail={<SvgProject />}
            description={iTwin.number}
            onClick={() => navigate(iTwin.id)}
          />
        ))
      }
    </FluidGrid>
  );
}
