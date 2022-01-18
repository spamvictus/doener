import "./styles.css";

import * as _ from "lodash";

class FPSCounter {
  private fpsCounter = 0;

  private lastReset = performance.now();

  private lastFPS = 0;

  public increment() {
    if (performance.now() - this.lastReset > 1000) {
      this.lastFPS = this.fpsCounter;
      this.fpsCounter = 0;
      this.lastReset = Date.now();
    }

    this.fpsCounter++;
  }

  public get fps(): number {
    return this.lastFPS;
  }
}

class CanvasContainer {
  private readonly context: CanvasRenderingContext2D;

  constructor(private readonly element: HTMLCanvasElement) {
    const context = element.getContext("2d");

    if (context === null) {
      throw new Error("Could not get the canvas rendering context");
    }

    this.context = context as CanvasRenderingContext2D;
  }

  public get width(): number {
    return this.element.width;
  }

  public get halfWidth(): number {
    return this.width / 2;
  }

  public get height(): number {
    return this.element.height;
  }

  public get halfHeight(): number {
    return this.height / 2;
  }

  public clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  public drawline(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color = "#32cd32"
  ) {
    this.context.strokeStyle = color;
    this.context.fillStyle = color;

    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.closePath();

    this.context.stroke();
  }

  public drawCircle(
    x: number,
    y: number,
    radius: number = 5,
    lineColor = "#32cd32",
    borderColor = "#32cd32"
  ) {
    this.context.strokeStyle = lineColor;
    this.context.fillStyle = borderColor;

    this.context.beginPath();
    this.context.arc(x, y, radius, 0, 360);
    this.context.closePath();

    this.context.stroke();
  }

  public drawText(
    x: number,
    y: number,
    textContent: string,
    color = "#32cd32"
  ) {
    this.context.strokeStyle = color;
    this.context.fillStyle = color;

    this.context.beginPath();
    this.context.strokeText(textContent, x, y);
    this.context.closePath();

    this.context.stroke();
  }
}

class HeartBanger {
  public lastBangAt = performance.now();

  private bangIndex = -1;

  private lastHeartbeat = 0;
  private bangData: number[] = [];

  constructor(
    private readonly timeInterval: number,
    private readonly canvasWidth: number
  ) {}

  public isBanging() {
    return this.bangIndex >= 0;
  }

  public getNextBangData(handledElements: number) {
    const removedElements = this.bangData.splice(0, handledElements);

    // console.log(handledElements, this.bangData);

    this.bangIndex =
      removedElements.length === handledElements ? this.bangIndex : -1;

    if (this.bangIndex === -1) {
      this.lastBangAt = performance.now();
    }

    return removedElements;
  }

  public needsBang(heartbeat: number) {
    const heartbeatInterval = 60 / heartbeat;
    const intervalInMilliseconds = heartbeatInterval * 1000;

    return performance.now() - this.lastBangAt > intervalInMilliseconds;
  }

  private linearInterpolate(a: number, b: number, progress: number = 0) {
    return a + (b - a) * progress;
  }

  public calculateBangData(heartbeat: number) {
    this.bangIndex = 0;
    const frameLength = Math.round(
      this.canvasWidth / ((this.timeInterval * 60) / 60)
    );
    const framePadding = Math.round(frameLength * 0.1);
    const unpaddedFrameLength = Math.round(frameLength - framePadding * 2);

    const heartData = [
      ..._.range(0, unpaddedFrameLength * 0.25).map((value, index, array) =>
        this.linearInterpolate(300, 50, index / array.length)
      ),
      ..._.range(
        unpaddedFrameLength * 0.25,
        unpaddedFrameLength * 0.75
      ).map((value, index, array) =>
        this.linearInterpolate(50, 550, index / array.length)
      ),
      ..._.range(
        unpaddedFrameLength * 0.75,
        unpaddedFrameLength
      ).map((value, index, array) =>
        this.linearInterpolate(550, 300, index / array.length)
      )
    ];
    const paddingData = new Array(framePadding).fill(300);

    // console.log(heartData);

    this.bangData = [...paddingData, ...heartData, ...paddingData];

    // this.bangData = _.range(0, frameLength, 1);

    // console.log("calculated bang data", frameLength, framePadding);
  }
}

class ECG {
  private readonly fpsCounter: FPSCounter;

  private readonly container: CanvasContainer;

  private readonly heartbanger: HeartBanger;

  public heartbeatsPerMinute = 60;
  private timeIntervalInSeconds = 10;
  private readonly framePaddingInPercent = 20;

  constructor(options: { element: HTMLCanvasElement | null }) {
    if (options.element === null) {
      throw new Error("The canvas element is not set");
    }

    if (options.element.nodeName.toLowerCase() !== "canvas") {
      throw new Error("The given HTML element is not an canvas element");
    }

    this.fpsCounter = new FPSCounter();
    this.container = new CanvasContainer(options.element);
    this.heartbanger = new HeartBanger(
      this.timeIntervalInSeconds,
      this.container.width
    );

    this.containerData = new Array(this.container.width).fill(
      this.container.halfHeight
    );

    this.draw = this.draw.bind(this);
  }

  private previousTimestamp = performance.now();

  public get frameInPixels(): number {
    return (
      this.container.width /
      ((this.timeIntervalInSeconds * 60) / this.heartbeatsPerMinute)
    );

    // return (this.container.width / (this.timeIntervalInSeconds * 60)) * 60;
  }

  public get framePadding(): number {
    return this.frameInPixels * (this.framePaddingInPercent / 100);
  }

  public get unpaddedFrameLength(): number {
    return this.frameInPixels - this.framePadding * 2;
  }

  private containerData: number[] = [];

  public draw() {
    const diff = performance.now() - this.previousTimestamp;
    this.previousTimestamp = performance.now();

    this.fpsCounter.increment();

    this.container.clear();

    const handledElements = Math.round(
      (this.timeIntervalInSeconds * 1000) / diff / 100
    );

    // const handledElements = Math.round(
    //   this.container.width *
    //     (((this.container.width / (this.timeIntervalInSeconds * 1000)) * diff) /
    //       100)
    // );

    console.log("handled elements", handledElements);

    if (this.containerData.length > this.container.width) {
      this.containerData = this.containerData.slice(handledElements);
    }

    if (this.heartbanger.isBanging()) {
      this.containerData = this.containerData.concat(
        this.heartbanger.getNextBangData(handledElements)
      );
    } else if (this.heartbanger.needsBang(this.heartbeatsPerMinute)) {
      this.heartbanger.calculateBangData(this.heartbeatsPerMinute);
    }

    for (let i = this.containerData.length; i < this.container.width; i++) {
      this.containerData.push(this.container.halfHeight);
    }

    this.containerData.forEach((entry, index) => {
      const previousElement = this.containerData[index - 1];

      if (previousElement === undefined) {
        return;
      }

      this.container.drawline(index - 1, previousElement, index, entry);
    });

    this.drawDebugInfo(diff);

    // const data = _.range(0, this.container.width, this.frameInPixels).map(
    //   (startPoint) => {
    //     return {
    //       paddingStart: startPoint + this.framePadding,
    //       center: startPoint + this.frameInPixels / 2,
    //       paddingEnd: startPoint + this.frameInPixels - this.framePadding
    //     };
    //   }
    // );

    // _.range(0, this.container.width, this.frameInPixels).forEach(
    //   (startPoint) => {
    //     this.container.drawline(
    //       startPoint,
    //       this.container.halfHeight,
    //       startPoint + this.framePadding,
    //       this.container.halfHeight
    //     );

    //     this.container.drawline(
    //       startPoint + this.frameInPixels - this.framePadding,
    //       this.container.halfHeight,
    //       startPoint + this.frameInPixels,
    //       this.container.halfHeight
    //     );

    //     this.container.drawCircle(
    //       startPoint + this.frameInPixels / 2,
    //       this.container.halfHeight
    //     );

    //     this.container.drawline(
    //       startPoint + this.framePadding,
    //       this.container.halfHeight,
    //       startPoint + this.framePadding + this.unpaddedFrameLength * 0.25,
    //       50
    //     );
    //     this.container.drawline(
    //       startPoint + this.framePadding + this.unpaddedFrameLength * 0.25,
    //       50,
    //       startPoint + this.framePadding + this.unpaddedFrameLength * 0.75,
    //       this.container.height - 50
    //     );
    //     this.container.drawline(
    //       startPoint + this.frameInPixels - this.framePadding,
    //       this.container.halfHeight,
    //       startPoint + this.framePadding + this.unpaddedFrameLength * 0.75,
    //       this.container.height - 50
    //     );
    //   }
    // );

    // console.log({ data });

    requestAnimationFrame(this.draw);
  }

  private drawDebugInfo(diff: number) {
    [
      `FPS: ${this.fpsCounter.fps}`,
      `Diff: ${diff / 1000}`,
      `BPM: ${this.heartbeatsPerMinute}`,
      `Time interval: ${this.timeIntervalInSeconds} ${
        this.timeIntervalInSeconds === 1 ? "second" : "seconds"
      }`,
      `Frame in pixels: ${this.frameInPixels}`,
      `Frame padding in pixels: ${this.framePadding}`,
      `Last heartbeat diff: ${
        (performance.now() - this.heartbanger.lastBangAt) / 1000
      } seconds`,
      `Heartbeat every second: ${60 / this.heartbeatsPerMinute}`,
      `Need bang: ${this.heartbanger.needsBang(
        this.heartbeatsPerMinute
      )} ${this.heartbanger.isBanging()}`,
      `Container data: ${this.containerData.length}`
    ].forEach((entry, index) => {
      this.container.drawText(5, 15 + index * 15, entry, "red");
    });
  }
}

console.clear();

const ecg = new ECG({
  element: document.getElementById("app") as HTMLCanvasElement
});

ecg.draw();

// setInterval(() => {
//   ecg.heartbeatsPerMinute = _.random(60, 120);
// }, 5000);
