import { fetchLyrics } from "../model/lyricsModel";
import Song from "../model/songModel";
import spotifyPresenter from "./spotifyPresenter";

/**
 * Display suporta apenas TEXTO PURO.
 * Fade, negrito e tamanho são SIMULADOS via caracteres.
 */

// ===== VISUAL HELPERS =====

// Linha principal (simula negrito + maior)
const emphasize = (text: string) => {
    if (!text) return "";
    return "  " + text.toUpperCase();
};

// Linha próxima (fade médio)
const fadeMedium = (text: string) => {
    if (!text) return "";
    return "· " + text.toLowerCase();
};

// Linha anterior (fade fraco)
const fadeWeak = (text: string) => {
    if (!text) return "";
    return "  " + text.toLowerCase();
};

class LyricsPresenter {
    currentTrackSongID: string = "";
    currentTrackLyrics: string = "";
    currentTrackSyncedLyrics: string = "";

    nextTrackSongID: string = "";
    nextTrackLyrics: string = "";
    nextTrackSyncedLyrics: string = "";

    prevLine: string = "";
    currentLine: string = "";
    nextLine: string = "";

    async updateLyrics(song: Song) {
        if (this.currentTrackSongID === song.songID) return;

        if (
            this.nextTrackSongID === song.songID &&
            this.nextTrackSyncedLyrics
        ) {
            this.currentTrackSongID = this.nextTrackSongID;
            this.currentTrackLyrics = this.nextTrackLyrics;
            this.currentTrackSyncedLyrics = this.nextTrackSyncedLyrics;
            return;
        }

        this.currentTrackSongID = song.songID;

        const lyrics = await fetchLyrics(song);
        this.currentTrackLyrics = lyrics.plainLyrics;
        this.currentTrackSyncedLyrics = lyrics.syncedLyrics;
    }

    async cacheNextLyrics(nextSong?: Song) {
        if (
            !nextSong ||
            this.nextTrackSongID === nextSong.songID ||
            this.currentTrackSongID === nextSong.songID
        ) return;

        this.nextTrackSongID = nextSong.songID;
        const lyrics = await fetchLyrics(nextSong);

        this.nextTrackLyrics = lyrics.plainLyrics;
        this.nextTrackSyncedLyrics = lyrics.syncedLyrics;
    }

    async updateLyricsLine() {
        if (!spotifyPresenter.currentSong || !this.currentTrackSyncedLyrics) {
            this.prevLine = "";
            this.currentLine = "NO LYRICS FOUND";
            this.nextLine = "";
            return;
        }

        const lines = this.currentTrackSyncedLyrics.split("\n");
        const parsedLines: { time: number; text: string }[] = [];

        for (const line of lines) {
            const match = line.match(/^\s*\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
            if (match) {
                const text = match[3].trim();
                if (text) {
                    const minutes = parseInt(match[1], 10);
                    const seconds = parseFloat(match[2]);
                    parsedLines.push({
                        time: minutes * 60 + seconds,
                        text
                    });
                }
            }
        }

        const BLUETOOTH_DELAY = 0.1;
        const progress = Math.max(
            0,
            spotifyPresenter.currentSong.progressSeconds - BLUETOOTH_DELAY
        );

        let currentIndex = -1;
        for (let i = 0; i < parsedLines.length; i++) {
            if (progress >= parsedLines[i].time) {
                currentIndex = i;
            } else {
                break;
            }
        }

        if (currentIndex === -1) {
            this.prevLine = "";
            this.currentLine = "";
            this.nextLine =
                parsedLines.length > 0
                    ? fadeMedium(parsedLines[0].text)
                    : "";
        } else {
            this.prevLine =
                currentIndex > 0
                    ? fadeWeak(parsedLines[currentIndex - 1].text)
                    : "";

            this.currentLine = emphasize(parsedLines[currentIndex].text);

            this.nextLine =
                currentIndex + 1 < parsedLines.length
                    ? fadeMedium(parsedLines[currentIndex + 1].text)
                    : "";
        }
    }
}

const lyricsPresenter = new LyricsPresenter();
export default lyricsPresenter;