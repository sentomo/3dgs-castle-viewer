import { DynamicTexture, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";

export const createClock = (scene: Scene) => {
  let currentTime = "";

  // 時刻を取得する関数
  const getTime = (): string => {
    const now = new Date();
    const hour = String(now.getHours());
    const min = String(now.getMinutes()).padStart(2, "0");
    const sec = String(now.getSeconds()).padStart(2, "0");
    return `${hour}:${min}:${sec}`;
  };

  // フォント設定
  const font_type = "RocknRoll One";
  const font_size = 20;
  const font = `${font_size}px ${font_type}`;

  // DynamicTexture 作成
  const clockTexture = new DynamicTexture("clockTexture", { width: 110, height: font_size*1.5 }, scene);
  const clockMat = new StandardMaterial("mat", scene);
  clockMat.diffuseTexture = clockTexture;

  // Plane 作成
  const clockPlane = MeshBuilder.CreatePlane("plane", { width: 2.0, height: 0.6 }, scene);
  clockPlane.material = clockMat;
  clockPlane.position = new Vector3(-2.5, 2.0, 2.0);

  // DynamicTexture を更新する関数
  const updateClockTexture = () => {
    currentTime = getTime();
    clockTexture.drawText(currentTime, null, null, font, "#000000", "#fffacd");
  };

  // 0.1秒更新
  setInterval(updateClockTexture, 100);

  // 初回実行
  updateClockTexture();

  return {
    clockPlane,  // 時計のオブジェクトを返す
  };
};
