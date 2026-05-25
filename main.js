import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

async function gatherTokens(items) {

  if (!items || items.length === 0) {
    return;
  }

  let centerX = 0;
  let centerY = 0;

  for (const item of items) {
    centerX += item.position.x;
    centerY += item.position.y;
  }

  centerX /= items.length;
  centerY /= items.length;

  await OBR.scene.items.updateItems(
    items.map(item => item.id),
    (drafts) => {
      for (const item of drafts) {
        item.position.x = centerX;
        item.position.y = centerY;
      }
    }
  );
}

OBR.onReady(async () => {

  await OBR.contextMenu.create({

    id: "gather-tokens",

    icons: [
      {
        icon: "/icon.png",
        label: "Gather Tokens"
      }
    ],

    filter: {
      every: [
        {
          key: "type",
          value: "IMAGE"
        }
      ]
    },

    async onClick(context) {

      const items = await OBR.scene.items.getItems(
        item => context.items.some(i => i.id === item.id)
      );

      await gatherTokens(items);
    }

  });

});
