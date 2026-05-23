<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

Route::get('/ping', function() {
    return response()->json(['message' => 'Liaison Angular-Laravel OK !']);
});
use App\Http\Controllers\ClasseController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\MatiereController;

Route::get('/classes', [ClasseController::class, 'index']);
Route::post('/classes', [ClasseController::class, 'store']);
Route::delete('/classes/{id}', [ClasseController::class, 'destroy']);

Route::get('/users', [UserController::class, 'index']);
Route::post('/users/promo', [UserController::class, 'storePromo']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);
Route::get('/users/{id}/bulletin', [UserController::class, 'bulletin']);
Route::post('/users/{id}/publish-bulletin', [UserController::class, 'publishBulletin']);

Route::get('/notes', [NoteController::class, 'index']);
Route::post('/notes', [NoteController::class, 'store']);
Route::post('/notes/publish', [NoteController::class, 'publish']);

Route::get('/matieres', [MatiereController::class, 'index']);
Route::post('/matieres', [MatiereController::class, 'store']);
Route::put('/matieres/{id}', [MatiereController::class, 'update']);
Route::delete('/matieres/{id}', [MatiereController::class, 'destroy']);