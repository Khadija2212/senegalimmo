<?php

namespace App\Http\Requests;

use App\Enums\MethodePaiement;
use App\Models\PaiementCaution;
use App\Models\PaiementIndemnite;
use App\Models\PaiementLoyer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InitierPaiementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $avecBail = PaiementLoyer::TYPE . ',' . PaiementCaution::TYPE;

        return [
            'type' => ['required', Rule::in([PaiementLoyer::TYPE, PaiementCaution::TYPE, PaiementIndemnite::TYPE])],
            'methode' => ['required', Rule::enum(MethodePaiement::class)],
            'bail_id' => ['required_if:type,' . $avecBail, 'nullable', 'integer', 'exists:contrats,id'],
            'promesse_id' => ['required_if:type,' . PaiementIndemnite::TYPE, 'nullable', 'integer', 'exists:promesses_vente,id'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'bail_id.required_if' => 'Le bail est requis pour ce paiement.',
            'promesse_id.required_if' => 'La promesse de vente est requise pour ce paiement.',
        ];
    }

    public function methode(): MethodePaiement
    {
        return MethodePaiement::from((string) $this->validated('methode'));
    }
}
