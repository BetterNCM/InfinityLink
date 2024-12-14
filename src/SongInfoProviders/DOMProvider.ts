import { reactInstance } from "../utils";
import { BaseProvider, PlayState } from "./BaseProvider";


export class DOMProvider extends BaseProvider {
    constructor() {
        super();
        let lastImgUrl;

        this.addEventListener("Pause", () => {
            (document.querySelector(".btnp, .cmd-icon-pause") as HTMLButtonElement)?.click();
        });

        this.addEventListener("Play", () => {
            (document.querySelector(".btnp, .cmd-icon-play") as HTMLButtonElement)?.click();
        });

        this.addEventListener("PreviousSong", () => {
            (document.querySelector(".btnc-prv, .cmd-icon-pre") as HTMLButtonElement)?.click();
        });

        this.addEventListener("NextSong", () => {
            (document.querySelector(".btnc-nxt, .cmd-icon-next") as HTMLButtonElement)?.click();
        });

        let playState: PlayState;
        setInterval(() => {
            const state = document.querySelector(".btnp-pause, .cmd-icon-pause")
                ? "Playing"
                : "Paused";
            if (playState !== state) {
                playState = state;
                this.dispatchEvent(
                    new CustomEvent("updatePlayState", { detail: playState }),
                );
            }
        }, 50);

        setInterval(() => {
            if (document.querySelector(".j-cover, [class^=\"DefaultBarWrapper_\"]")) {
                let imgUrl = (
                    document?.querySelector(".j-cover") as HTMLImageElement
                )?.src
                    .replace("orpheus://cache/?", "")
                    .replace(/\?(.*)/, "");

                imgUrl ??= reactInstance(document.querySelector('[class^="DefaultBarWrapper_"]')!).child.memoizedState.memoizedState[0][2].data.resource.album.cover

                if (lastImgUrl === imgUrl) return;
                lastImgUrl = imgUrl;
                console.log("UPDATE");
                const songName = (
                    document.querySelector(
                        ".j-title",
                    ) as HTMLParagraphElement | null
                )?.title ?? (
                    document.querySelector(
                        ".cmd-space.title > span",
                    ) as HTMLParagraphElement | null
                )?.innerText;
                this.dispatchEvent(
                    new CustomEvent("updateSongInfo", {
                        detail: {
                            songName,
                            albumName: songName,
                            authorName: (
                                document.querySelector(
                                    "p.j-title span.f-dib, .cmd-space.title .author",
                                ) as HTMLParagraphElement
                            ).innerText,
                            thumbnail: imgUrl,
                        },
                    }),
                );
            }
        }, 100);

        const updateTimeline = () => {
            if (document.querySelector(".j-cover, [class^=\"DefaultBarWrapper_\"]")) {
                let currentTime = (document.querySelector(".cmd-space.middle  > div:nth-child(2) > p:nth-child(1)") as HTMLParagraphElement | null)?.innerText || "00:00";
                let totalTime = (document.querySelector(".cmd-space.middle  > div:nth-child(2) > p:nth-child(3)") as HTMLParagraphElement | null)?.innerText || "00:00";

                // 啥都没有可能在内页
                if (currentTime === "00:00" && totalTime === "00:00") {
                    const timeText = (document.querySelector(".cmd-space > span:nth-child(5)") as HTMLSpanElement | null)?.innerText || "00:00 / 00:00";
                    [currentTime, totalTime] = timeText.split(' / ');
                }

                const timeToMillis = (timeText: string) => {
                    const [minutes, seconds] = timeText.split(':').map(Number);
                    return (minutes * 60 + seconds) * 1000;
                };

                const currentTimeMillis = timeToMillis(currentTime);
                const totalTimeMillis = timeToMillis(totalTime);
                console.debug(`[InfLink] Time: ${currentTimeMillis} / ${totalTimeMillis}`);

                this.dispatchEvent(
                    new CustomEvent("updateTimeline", {
                        detail: {
                            currentTime: currentTimeMillis,
                            totalTime: totalTimeMillis,
                        },
                    }),
                );
            }
        };

        setInterval(updateTimeline, 5000);

        document.addEventListener('click', (event) => {
            // 监听主页的进度条、内页的进度条、歌词旁边的一键跳转
            if (event.target instanceof HTMLElement && 
                (event.target.closest('.cmd-space > div > .slider-default') || 
                 event.target.closest('.cmd-space > div > .slider-vinyl') || 
                 event.target.closest('div[class^="ScrollableLyricDisplayContainer"]'))) {
                updateTimeline();
            }
        });
    }
}
