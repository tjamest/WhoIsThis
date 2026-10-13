#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public static class WhoIsThisWorldBuilder
{
    [MenuItem("WhoIsThis/Build Game Room in Current Scene")]
    public static void BuildRoom()
    {
        if (Object.FindObjectOfType<WhoIsThisWorldGame>() != null &&
            !EditorUtility.DisplayDialog("WhoIsThis", "A game board already exists in this scene. Create another one?", "Create", "Cancel")) return;

        var root = new GameObject("WhoIsThis World");
        Undo.RegisterCreatedObjectUndo(root, "Create WhoIsThis room");
        MakeFloor(root.transform);

        var gameObject = new GameObject("WhoIsThis Game State");
        gameObject.transform.SetParent(root.transform, false);
        var game = Undo.AddComponent<WhoIsThisWorldGame>(gameObject);

        var board = GameObject.CreatePrimitive(PrimitiveType.Cube);
        board.name = "Game board";
        board.transform.SetParent(root.transform, false);
        board.transform.position = new Vector3(0, 3.1f, 5.2f);
        board.transform.localScale = new Vector3(12f, 6f, .35f);
        board.GetComponent<Collider>().enabled = false;
        board.GetComponent<Renderer>().sharedMaterial = MakeMaterial(new Color(.13f, .16f, .13f));

        var guessWall = GameObject.CreatePrimitive(PrimitiveType.Cube);
        guessWall.name = "Guessing station";
        guessWall.transform.SetParent(root.transform, false);
        guessWall.transform.position = new Vector3(0, 2.1f, -6.3f);
        guessWall.transform.localScale = new Vector3(14f, 4f, .3f);
        guessWall.GetComponent<Collider>().enabled = false;
        guessWall.GetComponent<Renderer>().sharedMaterial = MakeMaterial(new Color(.19f, .22f, .18f));

        var canvasObject = new GameObject("Board text", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler));
        canvasObject.transform.SetParent(root.transform, false);
        canvasObject.transform.position = new Vector3(0, 3.1f, 4.99f);
        canvasObject.transform.rotation = Quaternion.Euler(0, 180, 0);
        canvasObject.transform.localScale = Vector3.one * .0065f;
        var canvas = canvasObject.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.WorldSpace;
        canvasObject.GetComponent<RectTransform>().sizeDelta = new Vector2(1800, 900);

        var status = MakeText(canvasObject.transform, "Status", new Vector2(0, 360), new Vector2(1640, 95), 34, TextAnchor.MiddleCenter, Color.white);
        var clue = MakeText(canvasObject.transform, "Clue", new Vector2(0, 245), new Vector2(1640, 80), 29, TextAnchor.MiddleCenter, new Color(.83f, .94f, .48f));
        var character = MakeText(canvasObject.transform, "Secret Character", new Vector2(0, 90), new Vector2(1640, 210), 54, TextAnchor.MiddleCenter, Color.white);
        var question = MakeText(canvasObject.transform, "Question and Answer", new Vector2(0, -95), new Vector2(1640, 150), 25, TextAnchor.MiddleCenter, new Color(.91f, .90f, .83f));
        var attempts = MakeText(canvasObject.transform, "Attempts", new Vector2(-480, -335), new Vector2(600, 70), 28, TextAnchor.MiddleCenter, Color.white);
        var scores = MakeText(canvasObject.transform, "Scoreboard", new Vector2(480, -335), new Vector2(900, 100), 23, TextAnchor.MiddleCenter, Color.white);
        game.statusText = status; game.clueText = clue; game.characterText = character;
        game.questionText = question; game.attemptsText = attempts; game.scoreText = scores;

        MakeButton(root.transform, game, "COMEÇAR", 0, new Vector3(-4.7f, .48f, 4.35f), new Vector3(2.25f, .75f, .24f), new Color(.77f, .91f, .35f));
        MakeButton(root.transform, game, "PRÓXIMA VEZ", 2, new Vector3(.3f, .48f, 4.35f), new Vector3(2.2f, .75f, .24f), new Color(.77f, .91f, .35f));
        MakeButton(root.transform, game, "SIM", 3, new Vector3(2.6f, .48f, 4.35f), new Vector3(1.25f, .75f, .24f), new Color(.46f, .70f, .38f));
        MakeButton(root.transform, game, "NÃO", 4, new Vector3(4.0f, .48f, 4.35f), new Vector3(1.25f, .75f, .24f), new Color(.77f, .43f, .38f));
        MakeButton(root.transform, game, "MAIS OU MENOS", 5, new Vector3(5.5f, .48f, 4.35f), new Vector3(1.65f, .75f, .24f), new Color(.72f, .65f, .36f));
        MakeButton(root.transform, game, "REIVINDICAR VEZ", 1, new Vector3(0, .48f, -5.2f), new Vector3(2.8f, .7f, .24f), new Color(.77f, .91f, .35f), true);

        string[] names = game.characters;
        for (int i = 0; i < names.Length; i++)
        {
            int col = i % 5;
            int row = i / 5;
            float x = -5.3f + col * 2.65f;
            float z = -5.95f;
            float y = 2.55f - row * .58f;
            MakeButton(root.transform, game, names[i], 10 + i, new Vector3(x, y, z), new Vector3(2.35f, .55f, .2f), new Color(.29f, .32f, .26f), true);
        }

        var seat = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        seat.name = "Vez da pessoa";
        seat.transform.SetParent(root.transform, false);
        seat.transform.position = new Vector3(0, .48f, -1.5f);
        seat.transform.localScale = new Vector3(1.2f, .48f, 1.2f);
        seat.GetComponent<Renderer>().sharedMaterial = MakeMaterial(new Color(.78f, .86f, .54f));

        EditorSceneManager.MarkSceneDirty(SceneManager.GetActiveScene());
        Selection.activeGameObject = root;
        EditorUtility.DisplayDialog("WhoIsThis", "A sala de jogo foi criada. Configure o VRC Scene Descriptor pelo SDK Control Panel e ajuste o ponto de spawn antes de testar.", "OK");
    }

    private static void MakeFloor(Transform root)
    {
        var floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
        floor.name = "Floor"; floor.transform.SetParent(root, false);
        floor.transform.position = new Vector3(0, -.15f, 0); floor.transform.localScale = new Vector3(24, .3f, 24);
        floor.GetComponent<Renderer>().sharedMaterial = MakeMaterial(new Color(.68f, .67f, .59f));
    }

    private static Text MakeText(Transform parent, string name, Vector2 position, Vector2 size, int fontSize, TextAnchor anchor, Color color)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
        go.transform.SetParent(parent, false);
        var rect = go.GetComponent<RectTransform>();
        rect.anchorMin = rect.anchorMax = new Vector2(.5f, .5f); rect.pivot = new Vector2(.5f, .5f);
        rect.anchoredPosition = position; rect.sizeDelta = size;
        var text = go.GetComponent<Text>();
        text.font = Resources.GetBuiltinResource<Font>("Arial.ttf"); text.fontSize = fontSize;
        text.alignment = anchor; text.color = color; text.horizontalOverflow = HorizontalWrapMode.Wrap;
        text.verticalOverflow = VerticalWrapMode.Overflow; text.text = name;
        return text;
    }

    private static void MakeButton(Transform root, WhoIsThisWorldGame game, string label, int action, Vector3 position, Vector3 size, Color color, bool facesPositiveZ = false)
    {
        var button = GameObject.CreatePrimitive(PrimitiveType.Cube);
        button.name = "Button - " + label;
        button.transform.SetParent(root, false); button.transform.position = position; button.transform.localScale = size;
        button.GetComponent<Renderer>().sharedMaterial = MakeMaterial(color);
        var behaviour = Undo.AddComponent<WhoIsThisWorldButton>(button);
        behaviour.game = game; behaviour.action = action;
        var labelObject = new GameObject("Label", typeof(TextMesh));
        labelObject.transform.SetParent(button.transform, false);
        labelObject.transform.localPosition = new Vector3(0, 0, facesPositiveZ ? .53f : -.53f);
        labelObject.transform.localRotation = Quaternion.Euler(0, facesPositiveZ ? 0 : 180, 0);
        labelObject.transform.localScale = Vector3.one * .16f;
        var text = labelObject.GetComponent<TextMesh>();
        text.text = label; text.anchor = TextAnchor.MiddleCenter; text.alignment = TextAlignment.Center;
        text.fontSize = 40; text.color = Color.white;
    }

    private static Material MakeMaterial(Color color)
    {
        var shader = Shader.Find("Standard");
        var material = new Material(shader); material.color = color;
        return material;
    }
}
#endif
