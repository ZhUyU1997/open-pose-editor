interface Window {
    openpose3d?: {
        sendTxt2img: (
            pose_image: string | null,
            pose_target: string,
            depth_image: string | null,
            depth_target: string,
            normal_image: string | null,
            normal_target: string,
            canny_image: string | null,
            canny_target: string
        ) => void
        sendImg2img: (
            pose_image: string,
            pose_target: string,
            depth_image: string,
            depth_target: string,
            normal_image: string,
            normal_target: string,
            canny_image: string,
            canny_target: string
        ) => void
        downloadImage: (image: string | null, name: string) => void
    }
}
