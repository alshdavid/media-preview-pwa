import './index.scss'
import { h } from 'preact'
import * as preact from 'preact'
import { App } from './app/index.js'

void async function main() {
    preact.render(<App/>, document.getElementById('root')!)
}()
