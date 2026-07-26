# Legacy renderer compatibility boundary

The renderer sources in this directory are retained for the explicit
`SIGNBOARD_RENDERER=legacy` rollback/testing path. Normal launches use the
packaged Vue renderer in `signboard-vue/dist/`; keep this source tree buildable
with `./buildjs.sh` while the compatibility boundary is supported.
