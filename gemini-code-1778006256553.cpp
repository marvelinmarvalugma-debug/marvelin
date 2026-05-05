#include <memory>

struct Nodo {
    int id;
    std::unique_ptr<Nodo> siguiente;
    // Constructor ya listo para que no pierdan tiempo en lo básico
    Nodo(int _id) : id(_id), siguiente(nullptr) {}
};

class ListaEnlazada {
public:
    std::unique_ptr<Nodo> cabeza;

    // EL RETO PARA EL ESTUDIANTE:
    void insertarAlInicio(int id) {
        // TODO: Implementar usando std::move para transferir la propiedad
    }

    void eliminarNodo(int id) {
        // TODO: Implementar la lógica de "puente" para no romper la cadena
    }
};