<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\Compte;
use App\Models\Conversation;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Cas « Échanger par messagerie » : conversations entre utilisateurs, à propos d'une annonce ou non. */
class ConversationController extends Controller
{
    private const PAR_PAGE = 50;

    public function index(Request $request): JsonResponse
    {
        $moi = $request->user();
        $conversations = $moi->conversations()->with(['participants:id,prenom,nom,role,photo_url', 'annonce.bien:id,titre'])
            ->orderByDesc('dernier_message_le')->get()
            ->map(fn (Conversation $c) => $c->toArray() + ['non_lus' => $c->nonLus($moi)]);

        return response()->json($conversations);
    }

    /** Ouvre (ou retrouve) la conversation avec un autre utilisateur et y dépose le premier message. */
    public function store(Request $request): JsonResponse
    {
        $d = $request->validate([
            'destinataire_id' => ['required', 'uuid', 'different:'.$request->user()->id],
            'annonce_id' => ['sometimes', 'nullable', 'uuid', 'exists:annonces,id'],
            'contenu' => ['required', 'string', 'max:5000'],
        ]);
        $destinataire = Compte::tous()->findOrFail($d['destinataire_id']);
        $this->exigerQue($destinataire instanceof Utilisateur, "On ne peut écrire qu'à un utilisateur de la plateforme.");
        $annonce = isset($d['annonce_id']) ? Annonce::findOrFail($d['annonce_id']) : null;

        $conversation = Conversation::entre($request->user(), $destinataire, $annonce);
        $message = $request->user()->envoyerMessage($conversation, $d['contenu']);

        return response()->json(['conversation' => $conversation, 'message' => $message], Response::HTTP_CREATED);
    }

    /** Les messages, du plus récent au plus ancien ; ceux reçus deviennent lus. */
    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $moi = $request->user();
        $this->exigerQue($conversation->aPourParticipant($moi));
        $page = $conversation->messages()->with('expediteur:id,prenom,nom')->latest('envoye_le')->paginate(self::PAR_PAGE);
        $page->getCollection()->filter(fn ($m) => $m->expediteur_id !== $moi->id)->each->marquerLu();

        return response()->json($page);
    }

    public function envoyer(Request $request, Conversation $conversation): JsonResponse
    {
        $this->exigerQue($conversation->aPourParticipant($request->user()));
        $contenu = $request->validate(['contenu' => ['required', 'string', 'max:5000']])['contenu'];

        return response()->json($request->user()->envoyerMessage($conversation, $contenu), Response::HTTP_CREATED);
    }
}
