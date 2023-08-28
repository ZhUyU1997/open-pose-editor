const files: Record<string, string> = {
    'models/hand.fbx': '../models/hand.fbx',
    'models/foot.fbx': '../models/foot.fbx',
    'models/reworked_hand.fbx': '../models/reworked_hand.fbx',
    'src/poses/data.bin': '../src/poses/data.bin',
}

async function loadAssets() {
    try {
        const params = new URLSearchParams(window.location.search)
        const url = params.get('config')
        if (url?.startsWith('/')) {
            const response = await fetch(url)
            const config = await response.json()
            Object.assign(files, config['assets'])
        }
    } catch (error) {
        console.error(error)
    }
}

loadAssets()

export default files
