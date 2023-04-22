const files: Record<string, string> = {
    'models/hand.fbx': '../models/hand.fbx',
    'models/foot.fbx': '../models/foot.fbx',
    'src/poses/data.bin': '../src/poses/data.bin',
}

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

export default files
