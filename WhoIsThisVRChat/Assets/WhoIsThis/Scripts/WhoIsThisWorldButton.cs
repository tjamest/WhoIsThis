using UdonSharp;
using UnityEngine;

public class WhoIsThisWorldButton : UdonSharpBehaviour
{
    public WhoIsThisWorldGame game;
    [Tooltip("0 Começar · 1 Reivindicar vez · 2 Próxima vez · 3 Sim · 4 Não · 5 Mais ou menos · 10+ palpite no índice ação - 10")]
    public int action;

    public override void Interact()
    {
        if (game == null) return;
        if (action == 0) game.PressStart();
        else if (action == 1) game.PressClaimTurn();
        else if (action == 2) game.PressNextTurn();
        else if (action == 3) game.PressAnswerYes();
        else if (action == 4) game.PressAnswerNo();
        else if (action == 5) game.PressAnswerMaybe();
        else if (action >= 10) game.SubmitGuess(action - 10);
    }
}
