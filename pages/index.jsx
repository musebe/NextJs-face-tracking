import Head from "next/head";
import Image from "next/image";
import { useRef, useState, MutableRefObject } from "react";

export default function Home() {
  /**
   * @type {MutableRefObject<HTMLVideoElement>}
   */
  const playerRef = useRef(null);

  /**
   * @type {MutableRefObject<HTMLCanvasElement>}
   */
  const canvasRef = useRef(null);

  const [video, setVideo] = useState();

  const [loading, setLoading] = useState(false);

  const onTimeUpdate = (ev) => {
    // Video element scroll height and scroll width. We use the scroll height and width instead of the video height and width because we want to be sure the dimensions match those of the canvas element.
    const videoHeight = playerRef.current.scrollHeight;
    const videoWidth = playerRef.current.scrollWidth;

    // Get the 2d canvas context
    const ctx = canvasRef.current.getContext("2d");

    // Whenever the video time updates make sure to clear any drawings on the canvas
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    // The video's current time
    const currentTime = playerRef.current.currentTime;

    // Iterate over detected faces
    for (const annotation of video.annotations.faceDetectionAnnotations) {
      // Each detected face may have different tracks
      for (const track of annotation.tracks) {
        // Get the timestamps for all bounding boxes
        for (const face of track.timestampedObjects) {
          // Get the timestamp in seconds
          const timestamp =
            parseInt(face.timeOffset.seconds ?? 0) +
            (face.timeOffset.nanos ?? 0) / 1000000000;

          // Check if the timestamp and video's current time match. We convert them to fixed-point notations of 1 decimal place
          if (timestamp.toFixed(1) == currentTime.toFixed(1)) {
            // Get the x coordinate of origin of the bounding box
            const x = (face.normalizedBoundingBox.left || 0) * videoWidth;

            // Get the y coordinate of origin of the bounding box
            const y = (face.normalizedBoundingBox.top || 0) * videoHeight;

            // Get the width of the bounding box
            const width =
              ((face.normalizedBoundingBox.right || 0) -
                (face.normalizedBoundingBox.left || 0)) *
              videoWidth;

            // Get the height of the bounding box
            const height =
              ((face.normalizedBoundingBox.bottom || 0) -
                (face.normalizedBoundingBox.top || 0)) *
              videoHeight;

            ctx.lineWidth = 4;
            ctx.strokeStyle = "#800080";
            ctx.strokeRect(x, y, width, height);
          }
        }
      }
    }
  };

  const handleUploadVideo = async () => {
    try {
      // Set loading to true
      setLoading(true);

      // Make a POST request to the `api/videos/` endpoint
      const response = await fetch("/api/videos", {
        method: "post",
      });

      const data = await response.json();

      // Check if the response is successful
      if (response.status >= 200 && response.status < 300) {
        const result = data.result;

        // Update our videos state with the results
        setVideo(result);
      } else {
        throw data;
      }
    } catch (error) {
      // TODO: Handle error
      console.error(error);
    } finally {
      setLoading(false);
      // Set loading to true once a response is available
    }
  };

  return [
    <div key="main div">
      <Head>
        <title>Face Tracking Using Google Video Intelligence</title>
        <meta
          name="description"
          content="Face Tracking Using Google Video Intelligence"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <h1>Face Tracking Using Google Video Intelligence</h1>
      </header>
      <main className="container">
        <div className="wrapper">
          <div className="actions">
            <button onClick={handleUploadVideo} disabled={loading}>
              Upload
            </button>
          </div>
          <hr />
          {loading
            ? [
                <div className="loading" key="loading div">
                  Please be patient as the video uploads...
                </div>,
                <hr key="loading div break" />,
              ]
            : null}

          {video ? (
            <div className="video-wrapper">
              <div className="video-container">
                <video
                  width={1000}
                  height={500}
                  src={video.uploadResult.secure_url}
                  ref={playerRef}
                  onTimeUpdate={onTimeUpdate}
                ></video>
                <canvas ref={canvasRef} height={500} width={1000}></canvas>
                <div className="controls">
                  <button
                    onClick={() => {
                      playerRef.current.play();
                    }}
                  >
                    Play
                  </button>
                  <button
                    onClick={() => {
                      playerRef.current.pause();
                    }}
                  >
                    Pause
                  </button>
                </div>
              </div>

              <div className="thumbnails-wrapper">
                Thumbnails
                <div className="thumbnails">
                  {video.annotations.faceDetectionAnnotations.map(
                    (annotation, annotationIndex) => {
                      return (
                        <div
                          className="thumbnail"
                          key={`annotation${annotationIndex}`}
                        >
                          <Image
                            className="thumbnail-image"
                            src={`data:image/jpg;base64,${annotation.thumbnail}`}
                            alt="Thumbnail"
                            layout="fill"
                          ></Image>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-videos">
              No video yet. Get started by clicking on upload above
            </div>
          )}
        </div>
      </main>
    </div>,
    <style key="style tag" jsx="true">{`
      * {
        box-sizing: border-box;
      }

      header {
        height: 100px;
        background-color: purple;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      header h1 {
        padding: 0;
        margin: 0;
        color: white;
      }

      .container {
        min-height: 100vh;
        background-color: white;
      }

      .container .wrapper {
        max-width: 1000px;
        margin: 0 auto;
      }

      .container .wrapper .actions {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .container .wrapper .actions button {
        margin: 10px;
        padding: 20px 40px;
        width: 80%;
        font-weight: bold;
        border: none;
        border-radius: 2px;
      }

      .container .wrapper .actions button:hover {
        background-color: purple;
        color: white;
      }

      .container .wrapper .video-wrapper {
        display: flex;
        flex-flow: column;
      }

      .container .wrapper .video-wrapper .video-container {
        position: relative;
        width: 100%;
        height: 500px;
        background: red;
      }

      .container .wrapper .video-wrapper .video-container video {
        position: absolute;
        object-fit: cover;
      }

      .container .wrapper .video-wrapper .video-container canvas {
        position: absolute;
        z-index: 1;
      }

      .container .wrapper .video-wrapper .video-container .controls {
        left: 0;
        bottom: 0;
        position: absolute;
        z-index: 1;
        background-color: #ffffff5b;
        width: 100%;
        height: 40px;
        display: flex;
        justify-items: center;
        align-items: center;
      }

      .container .wrapper .video-wrapper .video-container .controls button {
        margin: 0 5px;
      }

      .container .wrapper .video-wrapper .thumbnails-wrapper {
      }

      .container .wrapper .video-wrapper .thumbnails-wrapper .thumbnails {
        display: flex;
        flex-flow: row wrap;
      }

      .container
        .wrapper
        .video-wrapper
        .thumbnails-wrapper
        .thumbnails
        .thumbnail {
        position: relative;
        flex: 0 0 20%;
        height: 200px;
        border: solid;
      }

      .container
        .wrapper
        .video-wrapper
        .thumbnails-wrapper
        .thumbnails
        .thumbnail
        .thumbnail-image {
        width: 100%;
        height: 100%;
      }

      .container .wrapper .no-videos,
      .container .wrapper .loading {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `}</style>,
  ];
}
