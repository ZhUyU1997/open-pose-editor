import json
import os.path
import pathlib
import typing
import urllib.parse

import gradio as gr

# Get the base directory of the extension
try:
    root_path = pathlib.Path(__file__).resolve().parents[1]
except NameError:
    import inspect

    root_path = pathlib.Path(inspect.getfile(lambda: None)).resolve().parents[1]


def get_asset_url(
    file_path: pathlib.Path, append: typing.Optional[dict[str, str]] = None
) -> str:
    """Generate a URL with a query string to prevent caching."""
    if append is None:
        append = {"v": str(os.path.getmtime(file_path))}
    else:
        append = append.copy()
        append["v"] = str(os.path.getmtime(file_path))
    return f"/file={file_path.absolute()}?{urllib.parse.urlencode(append)}"


def write_config_file() -> pathlib.Path:
    """Write configuration file to be passed in the iframe query string."""
    # Models and poses
    assets = {
        "models/hand.fbx": get_asset_url(root_path / "models" / "hand.fbx"),
        "models/foot.fbx": get_asset_url(root_path / "models" / "foot.fbx"),
        "src/poses/data.bin": get_asset_url(root_path / "src" / "poses" / "data.bin"),
    }

    # MediaPipe Pose files
    MEDIAPIPE_POSE_VERSION = "0.5.1675469404"
    mediapipe_dir = root_path / "downloads" / "pose" / MEDIAPIPE_POSE_VERSION
    for file_name in [
        "pose_landmark_full.tflite",
        "pose_web.binarypb",
        "pose_solution_packed_assets.data",
        "pose_solution_simd_wasm_bin.wasm",
        "pose_solution_packed_assets_loader.js",
        "pose_solution_simd_wasm_bin.js",
    ]:
        file_path = mediapipe_dir / file_name
        if not file_path.exists():
            continue
        assets[file_name] = get_asset_url(file_path.absolute())

    # Write configuration file
    consts = {"assets": assets}
    config_dir = root_path / "downloads"
    config_dir.mkdir(mode=0o755, parents=True, exist_ok=True)
    config_path = config_dir / "config.json"
    config_path.write_text(json.dumps(consts))
    return config_path


def on_ui_tabs():
    """WebUI callback: Create tab"""
    with gr.Blocks(analytics_enabled=False) as blocks:
        create_ui()
    return [(blocks, "3D Openpose", "threedopenpose")]


def create_ui():
    """Create tab"""
    try:
        from modules.shared import opts

        use_online: bool = opts.openpose3d_use_online_version
        cn_max: int = opts.control_net_max_models_num
    except (ImportError, AttributeError):
        # Values when this script is run standalone or if controlnet is not installed
        cn_max = 0
        use_online = False

    if use_online:
        html_url = "https://zhuyu1997.github.io/open-pose-editor/"
    else:
        config = {"config": get_asset_url(write_config_file())}
        html_url = get_asset_url(root_path / "pages" / "index.html", config)

    with gr.Tabs(elem_id="openpose3d_main"):
        with gr.Tab(label="Edit Openpose"):
            gr.HTML(
                f"""
                <iframe id="openpose3d_iframe" src="{html_url}"></iframe>
                """
            )
            gr.Markdown(
                "Online version: [Online 3D Openpose Editor](https://zhuyu1997.github.io/open-pose-editor/)"
            )
        with gr.Tab(label="Send to ControlNet"):
            with gr.Row():
                send_t2i = gr.Button(value="Send to txt2img", variant="primary")
                send_i2i = gr.Button(value="Send to img2img", variant="primary")
            with gr.Row():
                cn_dropdown_list = [str(i) for i in range(cn_max)]
                cn_dropdown_list.insert(0, "-")
                with gr.Column(variant="panel"):
                    pose_image = gr.Image(
                        label="Pose",
                        elem_id="openpose3d_pose_image",
                    )
                    with gr.Row():
                        pose_target = gr.Dropdown(
                            label="Control Model number",
                            choices=cn_dropdown_list,
                            value="0" if cn_max >= 1 else "-",
                        )
                        pose_download = gr.Button(value="Download")
                with gr.Column(variant="panel"):
                    depth_image = gr.Image(
                        label="Depth",
                        elem_id="openpose3d_depth_image",
                    )
                    with gr.Row():
                        depth_target = gr.Dropdown(
                            label="Control Model number",
                            choices=cn_dropdown_list,
                            value="1" if cn_max >= 2 else "-",
                        )
                        depth_download = gr.Button(value="Download")
                with gr.Column(variant="panel"):
                    normal_image = gr.Image(
                        label="Normal",
                        elem_id="openpose3d_normal_image",
                    )
                    with gr.Row():
                        normal_target = gr.Dropdown(
                            label="Control Model number",
                            choices=cn_dropdown_list,
                            value="2" if cn_max >= 3 else "-",
                        )
                        normal_download = gr.Button(value="Download")
                with gr.Column(variant="panel"):
                    canny_image = gr.Image(
                        label="Canny",
                        elem_id="openpose3d_canny_image",
                    )
                    with gr.Row():
                        canny_target = gr.Dropdown(
                            label="Control Model number",
                            choices=cn_dropdown_list,
                            value="3" if cn_max >= 4 else "-",
                        )
                        canny_download = gr.Button(value="Download")

    send_cn_inputs = [
        pose_image,
        pose_target,
        depth_image,
        depth_target,
        normal_image,
        normal_target,
        canny_image,
        canny_target,
    ]
    send_t2i.click(
        None,
        send_cn_inputs,
        None,
        _js="window.openpose3d.sendTxt2img",
    )
    send_i2i.click(
        None,
        send_cn_inputs,
        None,
        _js="window.openpose3d.sendImg2img",
    )
    pose_download.click(
        None,
        pose_image,
        None,
        _js="(v) => window.openpose3d.downloadImage(v, 'pose')",
    )
    depth_download.click(
        None,
        depth_image,
        None,
        _js="(v) => window.openpose3d.downloadImage(v, 'depth')",
    )
    normal_download.click(
        None,
        normal_image,
        None,
        _js="(v) => window.openpose3d.downloadImage(v, 'normal')",
    )
    canny_download.click(
        None,
        canny_image,
        None,
        _js="(v) => window.openpose3d.downloadImage(v, 'canny')",
    )


def on_ui_settings():
    """WebUI callback: Create setting tab"""
    from modules.shared import OptionInfo, opts

    section = ("openpose3d", "3D Openpose Editor")

    opts.add_option(
        "openpose3d_use_online_version",
        OptionInfo(False, "Use online version", section=section),
    )


def main():
    """Main function called when this script is run standalone."""
    js_path = root_path / "javascript" / "index.js"
    css_path = root_path / "style.css"

    # JavaScript functions to simulate WebUI
    head = """
    <script>
        function waitForElement(parent, selector) {
            return new Promise((resolve) => {
                const observer = new MutationObserver(() => {
                    if (!parent.querySelector(selector)) {
                        return
                    }
                    observer.disconnect()
                    resolve(undefined)
                })

                observer.observe(parent, {
                    childList: true,
                    subtree: true,
                })

                if (parent.querySelector(selector)) {
                    resolve(undefined)
                }
            })
        }
        let onTabChangedCallback
        function gradioApp() {
            const elems = document.getElementsByTagName('gradio-app')
            const gradioShadowRoot = elems.length == 0 ? null : elems[0].shadowRoot
            return gradioShadowRoot ? gradioShadowRoot : document
        }
        async function onUiLoaded(callback) {
            await waitForElement(gradioApp(), '#openpose3d_main')
            await callback()
            await onTabChangedCallback?.()
        }
        function onUiUpdate(callback) {
            onTabChangedCallback = callback
        }
        function switch_to_txt2img() {}
        function switch_to_img2img() {}
    </script>
    """
    head += f"""
    <script type="module" src="{get_asset_url(js_path)}"></script>
    """

    # Simulate CSS loading of the WebUI
    original_template_response = gr.routes.templates.TemplateResponse

    def template_response(*args, **kwargs):
        res = original_template_response(*args, **kwargs)
        res.body = res.body.replace(b"</head>", f"{head}</head>".encode("utf8"))
        res.init_headers()
        return res

    gr.routes.templates.TemplateResponse = template_response

    # Create tab
    with gr.Blocks(analytics_enabled=False, css=css_path.read_text()) as blocks:
        with gr.Tab(label="3D Openpose", elem_id="tab_threedopenpose"):
            create_ui()
    blocks.launch()


try:
    # Register callbacks when called from the WebUI
    from modules import script_callbacks

    script_callbacks.on_ui_tabs(on_ui_tabs)
    script_callbacks.on_ui_settings(on_ui_settings)
except ImportError:
    # Call the main function when this script is run standalone
    main()
