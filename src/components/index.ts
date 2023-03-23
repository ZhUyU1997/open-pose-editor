import Swal from 'sweetalert2'
import i18n from '../i18n'

export function Oops(error: any) {
    Swal.fire({
        icon: 'error',
        title: i18n.t('Oops...')!,
        text: i18n.t('Something went wrong!')! + '\n' + error?.stack ?? error,
        footer: `<a href="https://github.com/ZhUyU1997/open-pose-editor/issues/new">${i18n.t(
            'If the problem persists, please click here to ask a question.'
        )}</a>`,
    })
}
