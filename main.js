import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

const ACTION_ID = "gather-tokens-action";

async function gatherSelectedTokens(context) {

  const selectedItems = context.items;

  if (!selectedItems || selectedItems.length === 0) {
    return;
  }

  let centerX = 0;
  let centerY = 0;

  for (const item of selectedItems) {
    centerX += item.position.x;
    centerY += item.position.y;
  }

  centerX /= selectedItems.length;
  centerY /= selectedItems.length;

  await OBR.scene.items.updateItems(
    selectedItems.map(item => item.id),
    (items) => {
      for (const item of items) {
        item.position.x = centerX;
        item.position.y = centerY;
      }
    }
  );
}

OBR.onReady(async () => {

  OBR.contextMenu.create({
    id: ACTION_ID,
    icons: [
      {
        icon: "/icon.png",
        label: "Gather Tokens"
      }
    ],

    embed: false,

    filter: {
      every: [
        {
          key: "type",
          value: "IMAGE"
        }
      ]
    },

    onClick(context) {
      gatherSelectedTokens(context);
    }
  });

});
