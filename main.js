import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

let savedSelection = [];

OBR.onReady(() => {

  OBR.player.onChange(player => {
    savedSelection = player.selection || [];
  });

  const button = document.getElementById("gather");

  button.addEventListener("click", async () => {

    if (!savedSelection.length) {
      console.log("No selection");
      return;
    }

    const items = await OBR.scene.items.getItems(
      item => savedSelection.includes(item.id)
    );

    if (!items.length) {
      console.log("No items");
      return;
    }

    // случайный центр
    const center =
      items[Math.floor(Math.random() * items.length)];

    const baseX = center.position.x;
    const baseY = center.position.y;

    await OBR.scene.items.updateItems(
      savedSelection,
      drafts => {

        let offset = 0;

        for (const item of drafts) {

          item.position = {
            x: baseX,
            y: baseY - offset
          };

          offset += 20;
        }

      }
    );

    console.log("Moved!");

  });

});
