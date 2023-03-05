export function download(href: string, title: string) {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.setAttribute('download', title);
    a.click();
}

export function getCurrentTime() {
    let today = new Date();
    let date = today.getFullYear() + '_' + (today.getMonth() + 1) + '_' + today.getDate();
    let time = today.getHours() + "_" + today.getMinutes() + "_" + today.getSeconds();
    let dateTime = date + '_' + time;

    return dateTime;
}