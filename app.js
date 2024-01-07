import { html, render } from "https://esm.sh/htm/preact"
import { signal, computed, effect } from "https://esm.sh/@preact/signals"

const caught = signal(
    JSON.parse(
        localStorage.caught ?? "{}"
    )
)

effect(() => localStorage.caught = JSON.stringify(caught.value))

const dex = signal(null)
const list = computed(() => {
    if (dex.value === null) {
        return null
    }

    const map = {
        paldea: Object.fromEntries(
            dex.value.paldea.map(
                mon => [mon.name, mon.number]
            )
        ),
        kitakami: Object.fromEntries(
            dex.value.kitakami.map(
                mon => [mon.name, mon.number]
            )
        ),
        blueberry: Object.fromEntries(
            dex.value.blueberry.map(
                mon => [mon.name, mon.number]
            )
        ),
    }

    const list = [...dex.value.paldea]
    list.push(
        ...dex.value.kitakami.filter(
            mon => map.paldea[mon.name] === undefined
        )
    )
    list.push(
        ...dex.value.blueberry.filter(
            mon => (
                map.paldea[mon.name] === undefined
                && map.kitakami[mon.name] === undefined
            )
        )
    )

    return list.map(
        (mon, index) => ({
            number: index + 1,
            name: mon.name,
            paldea: map.paldea[mon.name] ?? null,
            kitakami: map.kitakami[mon.name] ?? null,
            blueberry: map.blueberry[mon.name] ?? null,
        })
    )
})

fetch("data/list.json")
    .then(res => res.json())
    .then(data => dex.value = data)

const LoadScreen = () => {
    if (dex.value === null) {
        return html`
            <ws-hexagon-spinner ws-x="[@size 200px]" />
        `
    }

    return html`<${App} />`
}

const search = signal("")
const App = () => {
    const found = list.value.filter(
        mon => mon.name.toLowerCase().includes(search.value.toLowerCase())
    )
    const updateSearch = (evt) => {
        search.value = evt.target.value
    }
    const updateCaught = (evt) => {
        const name = evt.target.dataset.name
        const have = evt.target.checked

        caught.value = {
            ...caught.value,
            [name]: have
        }
    }

    return html`
        <ws-screen ws-x="[@screen-width min(100%, 480px)]">
            <ws-paper>
                <ws-flex slot="header">
                    <label ws-x="@control [$color @primary]">
                        <span slot="label-text">Search<//>
                        <input type="search" onInput=${updateSearch} value=${search} />
                    <//>
                    <div>
                        Found: ${found.length}
                    <//>
                <//>
                <ws-flex ws-x="[over auto]" slot="content">
                    ${found.map(
                        mon => html`
                            <label ws-x="@toggle [$color @primary] [b.w 0px]" key=${mon.name}>
                                <ws-grid ws-x="[gr.cols 60px 1fr]">
                                    <span>${mon.number}<//>
                                    <span>${mon.name}<//>
                                <//>
                                <input
                                    type="checkbox"
                                    checked=${caught.value[mon.name] ?? false}
                                    onInput=${updateCaught}
                                    data-name=${mon.name}
                                />
                            <//>
                        `
                    )}
                <//>
            <//>
        <//>
    `
}

render(html`<${LoadScreen} />`, document.body)
