import { useEffect } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'

// groups : meme structure que dans Layout -> [[titre, [[to, label, Icon], ...]], ...]
export default function CommandPalette({ open, setOpen, groups }) {
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setOpen])

  const go = (to) => { setOpen(false); navigate(to) }

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Recherche rapide" overlayClassName="cmdk-overlay" contentClassName="cmdk-content">
      <Command.Input placeholder="Aller à une page…" />
      <Command.List>
        <Command.Empty>Aucun résultat.</Command.Empty>
        {groups.map(([title, items]) => (
          <Command.Group key={title || 'main'} heading={title || 'Général'}>
            {items.map(([to, label, Icon]) => (
              <Command.Item key={to} value={`${title || ''} ${label}`} onSelect={() => go(to)}>
                <Icon size={16} strokeWidth={1.75} />{label}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  )
}