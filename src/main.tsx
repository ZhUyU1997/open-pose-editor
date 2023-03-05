import "./init"
import * as dat from 'dat.gui';
import "./index.css"
import { options } from "./config";
import { BodyEditor } from "./editor";

const editor = new BodyEditor(document.querySelector<HTMLCanvasElement>("#canvas")!)
const gui = new dat.GUI();


window.addEventListener('keydown', function (event) {
  switch (event.code) {
    case 'KeyX':
      options.moveMode = true
      gui.updateDisplay()
      break
  }
})

window.addEventListener('keyup', function (event) {
  switch (event.code) {
    case 'KeyX':
      options.moveMode = false
      gui.updateDisplay()
      break
  }
})


options["width"] = editor.Width
options["height"] = editor.Height
gui.add(editor, 'Width').name("宽度");
gui.add(editor, 'Height').name("高度");

function UpdateSize() {
  options["width"] = editor.Width
  options["height"] = editor.Height

  gui.updateDisplay()
}

UpdateSize()

gui.add(editor, 'MakeImages').name("骨架图/深度图");
gui.add(editor, 'CopyBody').name("复制骨架");
gui.add(options, 'moveMode').name("移动模式 (按X切换)");


gui.add(editor, "CameraNear", 0.1, 1000).name("相机near")
gui.add(editor, "CameraFar", 0.1, 1000).name("相机far")

window.addEventListener('resize', () => {
  UpdateSize()
})


editor.loadBodyData()