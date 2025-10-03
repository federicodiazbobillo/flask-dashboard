import importlib
import pkgutil
from flask import Blueprint

def register_blueprints(parent: Blueprint, package_name: str, package_path: str):
    """
    Recorre todos los módulos en `package_name` (ej: api.serverInfo.*),
    importa cada uno y registra cualquier variable `bp` que sea un Blueprint,
    colgándolos del blueprint padre (`parent`).
    """
    for _, module_name, ispkg in pkgutil.iter_modules(package_path):
        full_module_name = f"{package_name}.{module_name}"
        module = importlib.import_module(full_module_name)

        # Si el módulo define un blueprint `bp`, lo registramos
        if hasattr(module, "bp"):
            bp = getattr(module, "bp")
            if isinstance(bp, Blueprint):
                parent.register_blueprint(bp)
                print(f"✅ Blueprint registrado: {full_module_name} -> {bp.name}")

        # Si el módulo es un paquete (tiene __init__.py), recorrerlo recursivo
        if ispkg:
            subpackage = importlib.import_module(full_module_name)
            if hasattr(subpackage, "__path__"):
                register_blueprints(parent, full_module_name, subpackage.__path__)
