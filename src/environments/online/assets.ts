import handFBXFileUrl from '../../../models/hand.fbx?url'
import footFBXFileUrl from '../../../models/foot.fbx?url'
const PosesLibraryUrl = new URL('../../poses/data.bin', import.meta.url).href

export default {
    'models/hand.fbx': handFBXFileUrl,
    'models/foot.fbx': footFBXFileUrl,
    'src/poses/data.bin': PosesLibraryUrl,
}
