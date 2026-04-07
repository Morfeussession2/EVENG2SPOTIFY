import { List_ItemEvent, EvenHubEvent, EvenHubEventType, evenHubEventFromJson, waitForEvenAppBridge } from "@evenrealities/even_hub_sdk";
import spotifyPresenter from './spotifyPresenter';


export async function eventHandler() {
    const bridge = await waitForEvenAppBridge();

    const unsubscribe = bridge.onEvenHubEvent((event) => {
        if (event.listEvent) {
            console.log(event.listEvent.currentSelectItemIndex + " " + event.listEvent.currentSelectItemName);
            switch (event.listEvent.currentSelectItemIndex) {
                case 1:
                    spotifyPresenter.song_pauseplay();
                    break;
                case 2:
                    spotifyPresenter.song_forward();
                    break;
                default:
                    spotifyPresenter.song_back();
                    break;
            }
        } else if (event.textEvent) {
            console.log(event.textEvent.eventType);
        } else if (event.sysEvent) {
            console.log(event.sysEvent.eventType);
            // Double click event is type 3
            if (event.sysEvent.eventType === 3) {
                console.log("Double click recognized! Shutting down container...");
                bridge.shutDownPageContainer(1);
            }
        } else {
            console.log("Audio event");
        }
    });

    // Return unsubscribe in case we need to stop listening later
    return unsubscribe;
}