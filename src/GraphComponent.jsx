"use client";

import { useState, useRef, useCallback, memo } from "react";
import { ForceGraph2D } from "react-force-graph";
import { mockData } from "./mock";

const GraphComponent = () => {
  const graphRef = useRef(null);
  const [initialCenter, setInitialCenter] = useState(true);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState();

  const graphData = {
    nodes: mockData.data.graph.nodes,
    links: mockData.data.graph.links,
  };

  const handleLinkClick = useCallback((link) => {
    console.log("handleLinkClick", link);
    setHighlightNodes(new Set([link.source.id, link.target.id]));
    setHighlightLinks(new Set([`${link.source.id}-${link.target.id}`]));
  }, []);

  const handleNodeClick = useCallback(
    (node) => {
      console.log("handleNodeClick", node);

      const newHighlightLinks = new Set();
      graphData.links.forEach((link) => {
        if (link.source.id === node.id || link.target.id === node.id) {
          newHighlightLinks.add(`${link.source.id}-${link.target.id}`);
        }
      });

      setHighlightNodes(new Set([node.id]));
      setHighlightLinks(newHighlightLinks);
    },
    [graphData.links]
  );

  const handleNodeHover = useCallback((node) => {
    if (node) {
      setHoveredNode(node);
    } else {
      setHoveredNode();
    }
  }, []);

  const renderNode = useCallback(
    (node, ctx, globalScale) => {
      console.log("globalScale", globalScale, 14 * globalScale * 0.05);
      console.log("node", node);
      const fontSize = globalScale > 1 ? 12 / globalScale : 12 * globalScale;
      const padding = 8;
      const isHighlighted = highlightNodes.has(node.id);
      const imgSize = isHighlighted ? 30 : 20;
      const borderColor = isHighlighted ? "blue" : "#d3d3d3";

      if (node.data.details.display_picture) {
        if (!node.img) {
          // loads image
          node.img = new Image();
          node.img.src = node.data.details.display_picture;
          node.img.onload = () => {
            node.imageLoaded = true;
            graphRef.current?.refresh();
          };
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, imgSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = borderColor;
        ctx.stroke();
        ctx.closePath();

        if (node.imageLoaded) {
          ctx.clip();
          ctx.drawImage(
            node.img,
            node.x - imgSize / 2,
            node.y - imgSize / 2,
            imgSize,
            imgSize
          );
        } else {
          ctx.fillStyle = "#eee";
          ctx.fill();
        }
        ctx.restore();
      } else {
        // renders text in case of no display_picture
        const truncatedName = node.data.details.display_name.slice(0, 4);

        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(node.x, node.y, (imgSize + padding) / 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#333";
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(truncatedName, node.x, node.y);
      }

      if (node.isHovered) {
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "black";
        ctx.fillText(
          node.data.details.display_name,
          node.x,
          node.y + imgSize / 2 + padding
        );
      }
    },
    [highlightNodes]
  );

  return (
    <>
      {hoveredNode && (
        <div
          style={{
            position: "absolute",
            top: 200 + hoveredNode.y,
            left: 100 + Math.abs(hoveredNode.x),
          }}
        >
          {hoveredNode.data.details.display_name}
        </div>
      )}
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeAutoColorBy="id"
        linkColor={(link) =>
          highlightLinks.has(`${link.source.id}-${link.target.id}`)
            ? "red"
            : "gray"
        }
        onLinkClick={handleLinkClick}
        onNodeClick={handleNodeClick}
        nodeCanvasObject={renderNode}
        onNodeHover={handleNodeHover}
        onEngineStop={() => {
          if (initialCenter) {
            graphRef.current.zoomToFit();
          }
          setInitialCenter(false);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          const size = highlightNodes.has(node.id) ? 30 : 20;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }}
        enableNodeDrag={false}
      />
    </>
  );
};

export default memo(GraphComponent);
