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
    }
}
