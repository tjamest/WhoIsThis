using UdonSharp;
using UnityEngine;
using UnityEngine.UI;
using VRC.SDKBase;

[UdonBehaviourSyncMode(BehaviourSyncMode.Manual)]
public class WhoIsThisWorldGame : UdonSharpBehaviour
{
    [Header("Textos do painel")]
    public Text statusText;
    public Text clueText;
    public Text characterText;
    public Text questionText;
    public Text attemptsText;
    public Text scoreText;

    [Header("Cartas")]
    public string[] characters = {
        "Dra. Meredith Grey", "Doutor Estranho", "Dra. Nise da Silveira",
        "Sherlock Holmes", "Scooby-Doo", "Agatha Christie", "Cleópatra",
        "Albert Einstein", "Darth Vader", "Romeu", "Ayrton Senna", "Anitta",
        "Shrek", "Yoda", "Frida Kahlo", "Beyoncé", "Homem-Aranha",
        "Usain Bolt", "Mona Lisa", "Lara Croft"
    };
    public string[] clues = {
        "Todos são médicos.", "Todos são médicos.", "Todos são médicos.",
        "Todos são detetives.", "Todos são detetives.", "Todos são detetives.",
        "Todos já morreram.", "Todos já morreram.", "Todos estão mortos.",
        "Todos estão mortos.", "Todos são brasileiros.", "Todos são brasileiros.",
        "Todos são verdes.", "Todos são verdes.", "Todos são artistas.",
        "Todos são artistas.", "Todos usam uniforme.", "Todos são atletas.",
        "Todos são famosos.", "Todos são aventureiros."
    };

    [UdonSynced] private int phase; // 0 aguardando, 1 rodada, 2 acertou
    [UdonSynced] private int activePlayerId = -1;
    [UdonSynced] private int characterIndex = -1;
    [UdonSynced] private int attempts;
    [UdonSynced] private int lastAnswer = -1;
    [UdonSynced] private int roundNumber;
    [UdonSynced] private string lastQuestion = "";
    [UdonSynced] private string lastGuess = "";
    [UdonSynced] private string lastPlayerName = "";
    [UdonSynced] private int scoreCount;
    [UdonSynced] private int[] scoreAttempts = new int[80];
    [UdonSynced] private string[] scoreNames = new string[80];

    private void Start() { RefreshBoard(); }

    public void PressStart()
    {
        if (phase != 0 || Networking.LocalPlayer == null) return;
        TakeOwnership();
        phase = 1;
        roundNumber = 1;
        activePlayerId = Networking.LocalPlayer.playerId;
        lastPlayerName = Networking.LocalPlayer.displayName;
        attempts = 0;
        ChooseCard();
        lastQuestion = "Façam perguntas em voz alta. O grupo responde pelos botões.";
        lastAnswer = -1;
        SaveAndRefresh();
    }

    public void PressClaimTurn()
    {
        if (phase != 1 || activePlayerId >= 0 || Networking.LocalPlayer == null) return;
        TakeOwnership();
        activePlayerId = Networking.LocalPlayer.playerId;
        lastPlayerName = Networking.LocalPlayer.displayName;
        attempts = 0;
        lastGuess = "";
        lastQuestion = "Façam perguntas em voz alta. O grupo responde pelos botões.";
        lastAnswer = -1;
        ChooseCard();
        SaveAndRefresh();
    }

    public void PressAnswerYes() { SetAnswer(0); }
    public void PressAnswerNo() { SetAnswer(1); }
    public void PressAnswerMaybe() { SetAnswer(2); }

    private void SetAnswer(int value)
    {
        if (phase != 1 || Networking.LocalPlayer == null || Networking.LocalPlayer.playerId == activePlayerId) return;
        TakeOwnership();
        lastAnswer = value;
        SaveAndRefresh();
    }

    public void SubmitGuess(int guessIndex)
    {
        if (phase != 1 || Networking.LocalPlayer == null || Networking.LocalPlayer.playerId != activePlayerId) return;
        if (guessIndex < 0 || guessIndex >= characters.Length) return;
        TakeOwnership();
        attempts++;
        lastGuess = characters[guessIndex];
        if (guessIndex == characterIndex)
        {
            phase = 2;
            AddScore();
        }
        SaveAndRefresh();
    }

    public void PressNextTurn()
    {
        if (phase != 2) return;
        TakeOwnership();
        phase = 1;
        activePlayerId = -1;
        characterIndex = -1;
        attempts = 0;
        lastAnswer = -1;
        lastGuess = "";
        lastQuestion = "Próxima pessoa: toque em Reivindicar vez.";
        roundNumber++;
        SaveAndRefresh();
    }

    private void ChooseCard()
    {
        if (characters == null || characters.Length == 0) { characterIndex = -1; return; }
        characterIndex = Random.Range(0, characters.Length);
    }

    private void AddScore()
    {
        if (scoreCount >= scoreAttempts.Length) return;
        int insertAt = scoreCount;
        while (insertAt > 0 && scoreAttempts[insertAt - 1] > attempts)
        {
            scoreAttempts[insertAt] = scoreAttempts[insertAt - 1];
            scoreNames[insertAt] = scoreNames[insertAt - 1];
            insertAt--;
        }
        scoreAttempts[insertAt] = attempts;
        scoreNames[insertAt] = lastPlayerName;
        scoreCount++;
    }

    private void TakeOwnership()
    {
        if (Networking.LocalPlayer != null && !Networking.IsOwner(gameObject))
            Networking.SetOwner(Networking.LocalPlayer, gameObject);
    }

    private void SaveAndRefresh()
    {
        RequestSerialization();
        RefreshBoard();
    }

    public override void OnDeserialization() { RefreshBoard(); }

    private void RefreshBoard()
    {
        if (statusText != null)
        {
            if (phase == 0) statusText.text = "WHOISTHIS · Toque em Começar para iniciar";
            else if (phase == 2) statusText.text = "🎉 " + lastPlayerName + " acertou! Toque em Próxima vez.";
            else if (activePlayerId < 0) statusText.text = "Rodada " + roundNumber + " · próxima pessoa, reivindique a vez";
            else statusText.text = "Rodada " + roundNumber + " · vez de " + lastPlayerName + " — fique de costas para a carta";
        }
        if (clueText != null)
            clueText.text = characterIndex >= 0 && characterIndex < clues.Length ? "DICA · " + clues[characterIndex] : "DICA · todos podem ajudar";
        if (characterText != null)
            characterText.text = characterIndex >= 0 && characterIndex < characters.Length ? "PERSONAGEM\n" + characters[characterIndex] : "PERSONAGEM\n—";
        if (questionText != null)
        {
            string answer = lastAnswer == 0 ? "SIM" : lastAnswer == 1 ? "NÃO" : lastAnswer == 2 ? "MAIS OU MENOS" : "aguardando resposta";
            questionText.text = lastQuestion + "\nResposta mais recente: " + answer + (lastGuess.Length > 0 ? "\nPalpite: " + lastGuess : "");
        }
        if (attemptsText != null) attemptsText.text = "PALPITES · " + attempts;
        if (scoreText != null)
        {
            string board = "PLACAR · MENOS PALPITES NO TOPO";
            for (int i = 0; i < scoreCount; i++)
                board += "\n" + (i + 1) + ". " + scoreNames[i] + " — " + scoreAttempts[i] + (scoreAttempts[i] == 1 ? " palpite" : " palpites");
            scoreText.text = scoreCount == 0 ? "PLACAR\nAinda sem acertos" : board;
        }
    }
}
