// Viewer count display — driven by server viewer:update events only.
const Viewers = {
    count: 0,

    init() {
        $(document).on('viewer:update', (e, payload) => {
            Viewers.count = payload.viewers;
            $('#viewerCount').text(Viewers.count);
        });
    }
};
