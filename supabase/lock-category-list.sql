select distinct category
from public.inventory_items
where category not in (
  'Ciências Humanas',
  'Linguagem',
  'Ciências da Natureza',
  'Matemática',
  'Robótica',
  'Informática',
  'Maker',
  'Sala de Recurso',
  'Biblioteca'
)
order by category;

alter table public.inventory_items
drop constraint if exists inventory_items_category_check;

alter table public.inventory_items
add constraint inventory_items_category_check
check (
  category in (
    'Ciências Humanas',
    'Linguagem',
    'Ciências da Natureza',
    'Matemática',
    'Robótica',
    'Informática',
    'Maker',
    'Sala de Recurso',
    'Biblioteca'
  )
);
