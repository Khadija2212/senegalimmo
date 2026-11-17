<?php

namespace App\Exceptions;

use RuntimeException;

/** Un prestataire externe (paiement, carte, SMS, push) n'a pas pu traiter la demande. */
class PasserelleIndisponible extends RuntimeException {}
