import importlib
import pkgutil
import inspect
from flask import Flask, Blueprint

def register_blueprints(app: Flask, package_name: str, package_path: str):
    """
    Busca todos los módulos dentro de `package_name` (ej. api.serverInfo.*),
    importa cada uno y registra cualquier variable `bp` que sea un Blueprint.
    """
    for _, module_name, ispkg in pkgutil.iter_modules(package_path):
        full_module_name = f"{package_name}.{module_name}"
        module = importlib.import_module(full_module_name)

        # Si el módulo tiene un Blueprint llamado `bp`, lo registramos
        if hasattr(module, "bp"):
            bp = getattr(module, "bp")
            if isinstance(bp, Blueprint):
                app.register_blueprint(bp)
                print(f"✅ Blueprint registrado: {full_module_name} -> {bp.name}")

        # Si el módulo es un paquete (con __init__.py), recursivo
        if ispkg:
            subpackage = importlib.import_module(full_module_name)
            if hasattr(subpackage, "__path__"):
                register_blueprints(app, full_module_name, subpackage.__path__)
